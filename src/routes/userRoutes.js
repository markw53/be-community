const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, userController.getUserProfile);

// Update user profile
router.put('/profile', auth, userController.updateUserProfile);

// Get user's events (organized and attending)
router.get('/events', auth, userController.getUserEvents);

// Admin routes
router.get('/', auth, authorize('admin'), userController.getAllUsers);
router.get('/:id', auth, authorize('admin'), userController.getUserById);
router.put('/:id', auth, authorize('admin'), userController.updateUser);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

module.exports = router;