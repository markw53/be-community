import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import config from '../../config/config.js';
import logger from '../utils/logger.js';

// Rate limiting middleware
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.originalUrl 
    });
    res.status(429).json({
      message: 'Too many requests, please try again later.'
    });
  }
});

// CORS configuration
export const corsOptions = {
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Security headers middleware setup
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Adjust based on your needs
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// Apply security middleware to app
export const applySecurityMiddleware = (app) => {
  // Apply security headers
  app.use(securityHeaders);
  
  // Apply CORS
  app.use(cors(corsOptions));
  
  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);
  
  // Log middleware setup
  logger.info('Security middleware applied', {
    rateLimit: `${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 60000} minutes`,
    cors: typeof config.cors.origin === 'string' ? config.cors.origin : 'Multiple origins configured'
  });
};