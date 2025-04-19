import db from '../db/connection.js';
import admin from 'firebase-admin';
import cache from '../middleware/cache.js';
import logger from './logger.js';
import os from 'os';
import packageJson from '../../package.json' with { type: 'json' };
const { version } = packageJson;

/**
 * Perform database health check
 * @returns {Promise<Object>} Health check result
 */
const checkDatabase = async () => {
  try {
    const startTime = Date.now();
    const result = await db.query('SELECT 1 as db_check');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'up',
      responseTime: `${responseTime}ms`,
      message: 'Database connection successful'
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      status: 'down',
      error: error.message
    };
  }
};

/**
 * Perform Firebase health check
 * @returns {Promise<Object>} Health check result
 */
const checkFirebase = async () => {
  try {
    // Skip if Firebase is not initialized
    if (!admin.apps.length) {
      return {
        status: 'disabled',
        message: 'Firebase is not initialized'
      };
    }
    
    const startTime = Date.now();
    await admin.app().options.credential.getAccessToken();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'up',
      responseTime: `${responseTime}ms`,
      message: 'Firebase connection successful'
    };
  } catch (error) {
    logger.error('Firebase health check failed', error);
    return {
      status: 'down',
      error: error.message
    };
  }
};

/**
 * Perform Redis/cache health check
 * @returns {Promise<Object>} Health check result
 */
const checkCache = async () => {
  try {
    // Skip if Redis is not enabled
    if (!cache.client) {
      return {
        status: 'disabled',
        message: 'Redis is not enabled'
      };
    }
    
    const startTime = Date.now();
    await cache.client.ping();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'up',
      responseTime: `${responseTime}ms`,
      message: 'Redis connection successful'
    };
  } catch (error) {
    logger.error('Redis health check failed', error);
    return {
      status: 'down',
      error: error.message
    };
  }
};

/**
 * Get system information
 * @returns {Object} System information
 */
const getSystemInfo = () => {
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);
  
  return {
    uptime: uptimeFormatted,
    uptimeSeconds: uptime,
    memory: {
      total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
      free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
      usage: `${Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100)}%`
    },
    cpu: os.cpus().length,
    loadAvg: os.loadavg().map(load => load.toFixed(2))
  };
};

/**
 * Format uptime in a human-readable format
 * @param {number} uptime - Uptime in seconds
 * @returns {string} Formatted uptime
 */
const formatUptime = (uptime) => {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

/**
 * Perform comprehensive health check
 * @returns {Promise<Object>} Health check result
 */
export const performHealthCheck = async () => {
  const [dbCheck, firebaseCheck, cacheCheck] = await Promise.all([
    checkDatabase(),
    checkFirebase(),
    checkCache()
  ]);
  
  const systemInfo = getSystemInfo();
  
  // Determine overall status
  const servicesDown = [
    dbCheck.status === 'down',
    firebaseCheck.status === 'down',
    cacheCheck.status === 'down' && cacheCheck.status !== 'disabled'
  ].filter(Boolean).length;
  
  const overallStatus = servicesDown === 0 ? 'healthy' : 
                        servicesDown < 2 ? 'degraded' : 'unhealthy';
  
  return {
    status: overallStatus,
    version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbCheck,
      firebase: firebaseCheck,
      cache: cacheCheck
    },
    system: systemInfo
  };
};

export default {
  performHealthCheck
};