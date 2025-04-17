import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, authorize('admin'), userController.getAllUsers);

// Get user by ID
router.get('/:id', auth, userController.getUserById);

// Update user
router.put('/:id', auth, userController.updateUser);

// Delete user
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

// Get user's events (events they've registered for)
router.get('/:id/events', auth, userController.getUserEvents);

export default router;