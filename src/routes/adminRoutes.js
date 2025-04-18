// src/routes/adminRoutes.js (create this file if it doesn't exist)
import express from 'express';
import { isAdmin } from '../middleware/auth.js';
import { seedDatabase, resetAndSeedDatabase } from '../database/seeds/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /admin/seed:
 *   post:
 *     summary: Seed the database with initial data
 *     description: Adds sample data to the database for testing and development
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: users
 *         schema:
 *           type: integer
 *         description: Number of users to create
 /**
 * @swagger
 * /admin/seed:
 *   post:
 *     summary: Seed the database with initial data
 *     description: Adds sample data to the database for testing and development
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: users
 *         schema:
 *           type: integer
 *         description: Number of users to create
 *       - in: query
 *         name: events
 *         schema:
 *           type: integer
 *         description: Number of events to create
 *       - in: query
 *         name: categories
 *         schema:
 *           type: integer
 *         description: Number of categories to create
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeedingStatus'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have admin privileges
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/seed', isAdmin, async (req, res) => {
    try {
      // Get seeding parameters from query
      const userCount = req.query.users ? parseInt(req.query.users, 10) : undefined;
      const eventCount = req.query.events ? parseInt(req.query.events, 10) : undefined;
      const categoryCount = req.query.categories ? parseInt(req.query.categories, 10) : undefined;
      
      // Set environment variables for seeding
      if (userCount) process.env.SEED_USER_COUNT = userCount.toString();
      if (eventCount) process.env.SEED_EVENT_COUNT = eventCount.toString();
      if (categoryCount) process.env.SEED_CATEGORY_COUNT = categoryCount.toString();
      
      // Seed the database
      await seedDatabase();
      
      // Get counts of seeded data
      const userModel = (await import('../database/models/User.js')).default;
      const eventModel = (await import('../database/models/Event.js')).default;
      const categoryModel = (await import('../database/models/Category.js')).default;
      const attendeeModel = (await import('../database/models/Attendee.js')).default;
      
      const users = await userModel.count();
      const events = await eventModel.count();
      const categories = await categoryModel.count();
      const attendees = await attendeeModel.count();
      
      res.status(200).json({
        status: 'success',
        message: 'Database seeded successfully',
        details: {
          users,
          events,
          categories,
          attendees
        }
      });
    } catch (error) {
      logger.error(`Error seeding database: ${error.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to seed database',
        error: error.message
      });
    }
  });
  
  /**
   * @swagger
   * /admin/seed/reset:
   *   post:
   *     summary: Reset and seed the database
   *     description: Drops all tables, recreates them, and seeds with fresh data
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: users
   *         schema:
   *           type: integer
   *         description: Number of users to create
   *       - in: query
   *         name: events
   *         schema:
   *           type: integer
   *         description: Number of events to create
   *       - in: query
   *         name: categories
   *         schema:
   *           type: integer
   *         description: Number of categories to create
   *     responses:
   *       200:
   *         description: Database reset and seeded successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SeedingStatus'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         description: User does not have admin privileges
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.post('/seed/reset', isAdmin, async (req, res) => {
    try {
      // Get seeding parameters from query
      const userCount = req.query.users ? parseInt(req.query.users, 10) : undefined;
      const eventCount = req.query.events ? parseInt(req.query.events, 10) : undefined;
      const categoryCount = req.query.categories ? parseInt(req.query.categories, 10) : undefined;
      
      // Set environment variables for seeding
      if (userCount) process.env.SEED_USER_COUNT = userCount.toString();
      if (eventCount) process.env.SEED_EVENT_COUNT = eventCount.toString();
      if (categoryCount) process.env.SEED_CATEGORY_COUNT = categoryCount.toString();
      
      // Reset and seed the database
      await resetAndSeedDatabase();
      
      // Get counts of seeded data
      const userModel = (await import('../database/models/User.js')).default;
      const eventModel = (await import('../database/models/Event.js')).default;
      const categoryModel = (await import('../database/models/Category.js')).default;
      const attendeeModel = (await import('../database/models/Attendee.js')).default;
      
      const users = await userModel.count();
      const events = await eventModel.count();
      const categories = await categoryModel.count();
      const attendees = await attendeeModel.count();
      
      res.status(200).json({
        status: 'success',
        message: 'Database reset and seeded successfully',
        details: {
          users,
          events,
          categories,
          attendees
        }
      });
    } catch (error) {
      logger.error(`Error resetting and seeding database: ${error.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset and seed database',
        error: error.message
      });
    }
  });
  
  export default router;