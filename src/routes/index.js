import express from 'express';
const router = express.Router();

import * as authRoutes from './authRoutes.js';
import * as eventRoutes from './eventRoutes.js';
import * as userRoutes from './userRoutes.js';
import * as imageRoutes from './imageRoutes.js';

// Mount the routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/images', imageRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

export default router;