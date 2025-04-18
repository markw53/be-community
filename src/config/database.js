// src/config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Get current file directory (ES modules compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
const env = process.env.NODE_ENV || 'development';

// Default configuration
const defaultConfig = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'community_events',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: env === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
};

// Load environment-specific configuration if available
let config = defaultConfig;
const configPath = path.resolve(__dirname, '..', '..', 'config', `${env}.json`);

if (fs.existsSync(configPath)) {
  try {
    const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...defaultConfig, ...envConfig };
  } catch (error) {
    console.warn(`Error loading config from ${configPath}:`, error.message);
    console.warn('Using default configuration instead.');
  }
}

// SSL configuration for production environments
if (env === 'production' && process.env.DATABASE_URL) {
  config.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false // For Heroku/similar platforms that use self-signed certificates
    }
  };
}

// Create Sequelize instance
let sequelize;

// Support for DATABASE_URL environment variable (used by many hosting providers)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: config.logging,
    dialectOptions: config.dialectOptions,
    define: config.define,
    pool: config.pool
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging,
      dialectOptions: config.dialectOptions,
      define: config.define,
      pool: config.pool
    }
  );
}

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Only test connection in development to avoid unnecessary logs in production
if (env === 'development') {
  testConnection();
}

export { sequelize, config };
export default sequelize;