import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
if (process.env.NODE_ENV !== 'test') {
  try {
    // Try to load the service account file
    const serviceAccountPath = path.join(__dirname, 'config', 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      // Read and parse the service account file
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized with service account file');
    } 
    // Fallback to environment variables if file doesn't exist
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
      });
      console.log('Firebase Admin SDK initialized with environment variables');
    }
    // Skip Firebase if configured to do so
    else if (process.env.SKIP_FIREBASE === 'true') {
      console.log('Skipping Firebase initialization as configured');
    }
    else {
      console.warn('Firebase credentials not found. Authentication will be limited to JWT only.');
      // Set environment variable to use JWT auth instead
      process.env.USE_JWT_AUTH = 'true';
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    console.warn('Continuing without Firebase. Authentication will be limited to JWT only.');
    // Set environment variable to use JWT auth instead
    process.env.USE_JWT_AUTH = 'true';
  }
} else {
  console.log('Running in test mode. Skipping Firebase initialization.');
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API is running',
    authMode: process.env.USE_JWT_AUTH === 'true' ? 'JWT' : 'Firebase'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Start server
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`Using ${process.env.USE_JWT_AUTH === 'true' ? 'JWT' : 'Firebase'} authentication`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

export default app;