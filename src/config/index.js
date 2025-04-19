// src/config/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Initialize environment variables
dotenv.config();

// Get current file directory (ES modules compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment-specific config file if it exists
let envConfig = {};
const configPath = path.resolve(__dirname, '..', '..', 'config', `${NODE_ENV}.json`);

if (fs.existsSync(configPath)) {
  try {
    envConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`Loaded configuration from ${configPath}`);
  } catch (error) {
    console.warn(`Error loading config from ${configPath}:`, error.message);
  }
}

// Configuration object with defaults and overrides
const config = {
  // Environment
  env: NODE_ENV,
  isDev: NODE_ENV === 'development',
  isProd: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  // Database
  db: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'community_events',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    url: process.env.DATABASE_URL,
    logging: NODE_ENV === 'development' ? console.log : false,
    ssl: NODE_ENV === 'production',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
    },
    define: {
      timestamps: true,
      underscored: true
    }
  },
  
  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    resetPasswordExpiresIn: parseInt(process.env.RESET_PASSWORD_EXPIRES_IN || '3600000', 10), // 1 hour
  },
  
  // File Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'local', 's3', etc.
    local: {
      uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '..', 'uploads'),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif').split(',')
    },
    s3: {
      bucket: process.env.S3_BUCKET || 'community-events-uploads',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT
    }
  },
  
  // Email
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    from: process.env.EMAIL_FROM || 'noreply@communityevents.com',
    service: process.env.EMAIL_SERVICE || 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
    service: process.env.SERVICE_NAME || 'community-events-api'
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: (process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE').split(',')
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // limit each IP to 100 requests per windowMs
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGINATION_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.MAX_PAGINATION_LIMIT || '100', 10)
  },
  
  // Firebase (if using Firebase Auth)
  firebase: {
    enabled: process.env.FIREBASE_ENABLED === 'true',
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    databaseURL: process.env.FIREBASE_DATABASE_URL
  },
  
  // Seeding
  seeding: {
    enabled: process.env.ENABLE_SEEDING !== 'false',
    truncate: process.env.TRUNCATE_BEFORE_SEED === 'true',
    usersCount: parseInt(process.env.SEED_USERS_COUNT || '50', 10),
    eventsCount: parseInt(process.env.SEED_EVENTS_COUNT || '100', 10),
    categoriesCount: parseInt(process.env.SEED_CATEGORIES_COUNT || '10', 10),
    maxAttendeesPerEvent: parseInt(process.env.SEED_MAX_ATTENDEES_PER_EVENT || '20', 10)
  },
  
  // Override with environment-specific config
  ...envConfig
};

// Validate critical configuration
function validateConfig() {
  const requiredInProduction = [
    { key: 'auth.jwtSecret', defaultValue: 'your-secret-key-change-in-production' },
    { key: 'db.password', defaultValue: 'postgres' }
  ];
  
  if (NODE_ENV === 'production') {
    for (const { key, defaultValue } of requiredInProduction) {
      const parts = key.split('.');
      let value = config;
      for (const part of parts) {
        value = value[part];
      }
      
      if (value === defaultValue) {
        console.warn(`WARNING: Using default value for ${key} in production environment!`);
      }
    }
  }
}

validateConfig();

// Debug configuration in development
if (NODE_ENV === 'development') {
  // Create a safe version of config without sensitive data for logging
  const safeConfig = { ...config };
  if (safeConfig.db) safeConfig.db = { ...safeConfig.db, password: '***REDACTED***' };
  if (safeConfig.auth) safeConfig.auth = { ...safeConfig.auth, jwtSecret: '***REDACTED***' };
  if (safeConfig.email && safeConfig.email.auth) {
    safeConfig.email = { ...safeConfig.email, auth: { ...safeConfig.email.auth, pass: '***REDACTED***' } };
  }
  if (safeConfig.firebase) {
    safeConfig.firebase = { ...safeConfig.firebase, privateKey: '***REDACTED***' };
  }
  
  console.log('Application configuration:', JSON.stringify(safeConfig, null, 2));
}

export default config;