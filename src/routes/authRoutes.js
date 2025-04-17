import express from 'express';
import * as authController from '../controllers/authController.js';
import { auth } from '../middleware/aut.js';

const router = express.Router();

// Register a new user (non-Firebase)
router.post('/register', authController.register);

// Login user (non-Firebase)
router.post('/login', authController.login);

// Process Firebase authentication
router.post('/firebase', auth, authController.processFirebaseAuth);

// Get current user profile
router.get('/me', auth, authController.getCurrentUser);

export default router;