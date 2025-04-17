const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Register a new user (non-Firebase)
router.post('/register', authController.register);

// Login user (non-Firebase)
router.post('/login', authController.login);

// Process Firebase authentication
router.post('/firebase', auth, authController.processFirebaseAuth);

// Get current user profile
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;