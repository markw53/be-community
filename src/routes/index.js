// src/routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import eventRoutes from './eventRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import adminRoutes from './adminRoutes.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Users
 *     description: User management
 *   - name: Events
 *     description: Event management
 *   - name: Categories
 *     description: Event categories
 *   - name: Admin
 *     description: Administrative operations
 */

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', authenticate, userRoutes);
router.use('/events', eventRoutes); // Some event routes may be public
router.use('/categories', categoryRoutes);
router.use('/admin', authenticate, adminRoutes);

export default router;