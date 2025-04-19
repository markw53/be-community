import logger from '../utils/logger.js';
import config from '../../src/config/config.js';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Default status code and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated'
    });
  } else {
    logger.warn('Client error', {
      error: err.message,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated'
    });
  }
  
  // Prepare response
  const errorResponse = {
    message,
    status: statusCode
  };
  
  // Add error details in non-production environments or if they exist
  if (config.env !== 'production' || err.details) {
    errorResponse.details = err.details || null;
  }
  
  // Add stack trace in development
  if (config.env === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Async handler to catch errors in async route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};