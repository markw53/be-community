import { body, param, query, validationResult } from 'express-validator';
import { ApiError } from './errorHandler.js';

// Validation middleware factory
export const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    // Format validation errors
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    // Throw API error with validation details
    throw new ApiError(400, 'Validation Error', formattedErrors);
  };
};

// Common validation rules
export const eventValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Title must be between 3 and 255 characters'),
    body('description')
      .optional()
      .trim(),
    body('startTime')
      .isISO8601()
      .withMessage('Start time must be a valid ISO 8601 date'),
    body('endTime')
      .isISO8601()
      .withMessage('End time must be a valid ISO 8601 date')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startTime)) {
          throw new Error('End time must be after start time');
        }
        return true;
      }),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be at most 100 characters'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
    body('isPublished')
      .optional()
      .isBoolean()
      .withMessage('isPublished must be a boolean')
  ],
  update: [
    param('id')
      .isInt()
      .withMessage('Event ID must be an integer'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Title must be between 3 and 255 characters'),
    body('description')
      .optional()
      .trim(),
    body('startTime')
      .optional()
      .isISO8601()
      .withMessage('Start time must be a valid ISO 8601 date'),
    body('endTime')
      .optional()
      .isISO8601()
      .withMessage('End time must be a valid ISO 8601 date')
      .custom((value, { req }) => {
        if (req.body.startTime && new Date(value) <= new Date(req.body.startTime)) {
          throw new Error('End time must be after start time');
        }
        return true;
      }),
    body('location')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Location cannot be empty'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be at most 100 characters'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
    body('isPublished')
      .optional()
      .isBoolean()
      .withMessage('isPublished must be a boolean'),
      body('isCancelled')
      .optional()
      .isBoolean()
      .withMessage('isCancelled must be a boolean')
  ],
  getAll: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .trim(),
    query('search')
      .optional()
      .trim(),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('published')
      .optional()
      .isBoolean()
      .withMessage('Published must be a boolean')
  ]
};

export const userValidation = {
  register: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Display name must be between 2 and 255 characters')
  ],
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  update: [
    param('id')
      .isInt()
      .withMessage('User ID must be an integer'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Display name must be between 2 and 255 characters'),
    body('bio')
      .optional()
      .trim(),
    body('photoUrl')
      .optional()
      .trim()
      .isURL()
      .withMessage('Photo URL must be a valid URL')
  ]
};

export const authValidation = {
  firebaseAuth: [
    body('idToken')
      .notEmpty()
      .withMessage('Firebase ID token is required')
  ]
};

export const imageValidation = {
  upload: [
    body('eventId')
      .optional()
      .isInt()
      .withMessage('Event ID must be an integer'),
    body('isPrimary')
      .optional()
      .isBoolean()
      .withMessage('isPrimary must be a boolean')
  ]
};

