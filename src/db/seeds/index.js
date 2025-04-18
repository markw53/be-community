// src/database/seeds/index.js
import { sequelize } from '../config.js';
import { seedUsers } from './userSeeds.js';
import { seedEvents } from './eventSeeds.js';
import { seedCategories } from './categorySeeds.js';
import { seedAttendees } from './attendeeSeeds.js';
import logger from '../../utils/logger.js';
import config from '../../../config/config.js';

/**
 * Seed the database with initial data
 * @returns {Promise<boolean>} True if seeding was successful
 */
export async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // Get seeding configuration
    const seedConfig = config.db.seeding;
    
    // Execute seeds in the correct order (respecting foreign key constraints)
    logger.info('Seeding categories...');
    await seedCategories(seedConfig.categoryCount);
    
    logger.info('Seeding users...');
    await seedUsers(seedConfig.userCount);
    
    logger.info('Seeding events...');
    await seedEvents(seedConfig.eventCount);
    
    logger.info('Seeding attendees...');
    await seedAttendees();
    
    logger.info('Database seeding completed successfully');
    return true;
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    throw error;
  }
}

/**
 * Reset the database and seed it with fresh data
 * @returns {Promise<boolean>} True if reset and seeding was successful
 */
export async function resetAndSeedDatabase() {
  try {
    logger.info('Resetting database...');
    
    // Force sync will drop all tables and recreate them
    await sequelize.sync({ force: true });
    
    logger.info('Database reset complete. Starting seeding...');
    
    // Seed the database
    await seedDatabase();
    
    logger.info('Database reset and seed completed successfully');
    return true;
  } catch (error) {
    logger.error(`Database reset and seed failed: ${error.message}`);
    throw error;
  }
}

// For direct execution: node src/database/seeds/index.js
if (process.env.SEED_COMMAND) {
  const command = process.env.SEED_COMMAND;
  
  if (command === 'seed') {
    seedDatabase()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else if (command === 'reset') {
    resetAndSeedDatabase()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    console.error(`Unknown seed command: ${command}`);
    process.exit(1);
  }
}