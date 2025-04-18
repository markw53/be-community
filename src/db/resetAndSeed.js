// src/database/resetAndSeed.js
import { sequelize } from './config.js';
import { seedDatabase } from './seeds/index.js';
import logger from '../utils/logger.js';

async function resetAndSeedDatabase() {
  try {
    logger.info('Resetting database...');
    
    // Force sync will drop all tables and recreate them
    await sequelize.sync({ force: true });
    
    logger.info('Database reset complete. Starting seeding...');
    
    // Seed the database
    await seedDatabase();
    
    logger.info('Database reset and seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Database reset and seed failed: ${error.message}`);
    process.exit(1);
  }
}

resetAndSeedDatabase();