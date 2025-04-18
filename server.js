import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';

// Import configuration and utilities
import config from './config/config.js';
import logger from './src/utils/logger.js';
import { applySecurityMiddleware } from './src/middleware/security.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';
import { i18nMiddleware } from './src/utils/i18n.js';
import setupSwagger from './src/utils/swagger.js';
import { performHealthCheck } from './src/utils/healthCheck.js';
import { closeRedisConnection } from './src/middleware/cache.js';
import { closeQueues } from './src/jobs/queue.js';
import { sequelize } from './src/database/config.js';
import { seedDatabase } from './src/database/seeds/index.js';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import imageRoutes from './src/routes/imageRoutes.js';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();

// Initialize Sentry for error tracking (if DSN is provided)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.env,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
  });
  logger.info('Sentry initialized for error tracking');
}

// Initialize Firebase Admin SDK
try {
  // Try to load the service account file
  const serviceAccountPath = config.firebase.serviceAccountPath;
  
  if (fs.existsSync(serviceAccountPath)) {
    // Read and parse the service account file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logger.info('Firebase Admin SDK initialized with service account file');
  } 
  // Fallback to environment variables if file doesn't exist
  else if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail
      })
    });
    logger.info('Firebase Admin SDK initialized with environment variables');
  }
  // Skip Firebase if configured to do so
  else if (process.env.SKIP_FIREBASE === 'true') {
    logger.info('Skipping Firebase initialization as configured');
  }
  else {
    logger.warn('Firebase credentials not found. Authentication will be limited to JWT only.');
    // Set environment variable to use JWT auth instead
    process.env.USE_JWT_AUTH = 'true';
  }
} catch (error) {
  logger.error('Error initializing Firebase Admin SDK:', error);
  logger.warn('Continuing without Firebase. Authentication will be limited to JWT only.');
  // Set environment variable to use JWT auth instead
  process.env.USE_JWT_AUTH = 'true';
}

// Use Sentry request handler if initialized
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Apply security middleware (helmet, cors, rate limiting)
applySecurityMiddleware(app);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Setup request logging
if (config.env === 'production') {
  // In production, log to files
  const accessLogStream = fs.createWriteStream(
    path.join(config.logging.directory, 'access.log'), 
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  // In development, use colorful console logging
  app.use(morgan('dev'));
}

// Internationalization middleware
app.use(i18nMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup API documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check system health
 *     description: Returns the health status of the API and its dependencies
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get('/health', async (req, res) => {
  const healthStatus = await performHealthCheck();
  
  // Set appropriate status code based on health
  const statusCode = healthStatus.status === 'healthy' ? 200 :
                     healthStatus.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthStatus);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: req.t('welcome'),
    version: config.version,
    documentation: '/api-docs'
  });
});

// Use Sentry error handler if initialized
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Sync database models
    await sequelize.sync({ alter: config.env === 'development' });
    logger.info('Database synchronized');
    
    // Seed database in development if flag is set
    if (config.env === 'development' && process.env.SEED_DB === 'true') {
      logger.info('Seeding database...');
      await seedDatabase();
      logger.info('Database seeded successfully');
    }
    
    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running in ${config.env} mode on port ${config.port}`);
      logger.info(`Using ${process.env.USE_JWT_AUTH === 'true' ? 'JWT' : 'Firebase'} authentication`);
      logger.info(`API documentation available at http://localhost:${config.port}/api-docs`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      try {
        // Close database connections
        await sequelize.close();
        logger.info('Database connections closed');
        
        // Close Redis connection if enabled
        await closeRedisConnection();
        
        // Close job queues if enabled
        await closeQueues();
        
        // Exit with success code
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown', err);
        process.exit(1);
      }
    };
    
    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      
      // In production, try to gracefully shutdown
      // In development, exit immediately for faster debugging
      if (config.env === 'production') {
        gracefulShutdown('uncaughtException');
      } else {
        process.exit(1);
      }
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      
      // In production, try to gracefully shutdown
      // In development, exit immediately for faster debugging
      if (config.env === 'production') {
        gracefulShutdown('unhandledRejection');
      } else {
        process.exit(1);
      }
    });
    
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Call the initialization function
initializeApp();

export default app;