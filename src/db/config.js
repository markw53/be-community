// src/database/config.js
import { Sequelize } from 'sequelize';
import config from '../../src/config/config.js';
import logger from '../utils/logger.js';

const dbConfig = config.db;

// Create Sequelize instance
export const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect || 'postgres',
    logging: dbConfig.sequelize?.logging || false,
    pool: dbConfig.sequelize?.pool || {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: dbConfig.sequelize?.dialectOptions || {},
    define: dbConfig.sequelize?.define || {
      timestamps: true,
      underscored: false
    }
  }
);

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error(`Unable to connect to the database: ${error.message}`);
    return false;
  }
};

export default sequelize;