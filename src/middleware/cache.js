// src/middleware/cache.js
import NodeCache from 'node-cache';
import config from '../config/index.js';

// Create cache instance with TTL in seconds and check period in seconds
const cache = new NodeCache({
  stdTTL: config.cache?.defaultTTL || 300, // Default TTL: 5 minutes
  checkperiod: config.cache?.checkPeriod || 60, // Check for expired keys every minute
  useClones: false, // For better performance with large objects
  deleteOnExpire: true // Automatically delete expired items
});

// Redis client (initialized if Redis is enabled)
let redisClient = null;

// Initialize Redis if configured
if (config.cache?.useRedis) {
  try {
    const { createClient } = await import('redis');
    
    redisClient = createClient({
      url: config.cache.redisUrl || 'redis://localhost:6379',
      password: config.cache.redisPassword,
      database: config.cache.redisDb || 0
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    await redisClient.connect();
    console.log('Redis client connected successfully');
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    console.warn('Falling back to in-memory cache');
  }
}

/**
 * Close Redis connection if it exists
 * @returns {Promise<void>}
 */
export const closeRedisConnection = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
  return Promise.resolve();
};

/**
 * Generate a cache key based on the request
 * @param {Object} req - Express request object
 * @param {string} prefix - Optional prefix for the cache key
 * @returns {string} The cache key
 */
const generateCacheKey = (req, prefix = '') => {
  const path = req.originalUrl || req.url;
  const method = req.method;
  const query = JSON.stringify(req.query || {});
  const userId = req.user?.id || 'anonymous';
  
  // Include user ID in cache key for personalized responses
  return `${prefix}:${method}:${path}:${query}:${userId}`;
};

/**
 * Get item from cache (tries Redis first, falls back to local cache)
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
const getFromCache = async (key) => {
  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      // Fall back to local cache
    }
  }
  
  return cache.get(key);
};

/**
 * Set item in cache (tries Redis first, falls back to local cache)
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
const setInCache = async (key, value, ttl) => {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttl });
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      // Fall back to local cache
    }
  }
  
  return cache.set(key, value, ttl);
};

/**
 * Delete item from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
const deleteFromCache = async (key) => {
  if (redisClient) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      // Fall back to local cache
    }
  }
  
  return cache.del(key);
};

/**
 * Middleware to cache API responses
 * @param {Object} options - Caching options
 * @param {number} options.ttl - Time to live in seconds
 * @param {string} options.prefix - Prefix for the cache key
 * @param {Function} options.keyGenerator - Custom function to generate cache key
 * @param {Function} options.condition - Function to determine if response should be cached
 * @returns {Function} Express middleware function
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = config.cache?.defaultTTL || 300,
    prefix = '',
    keyGenerator = generateCacheKey,
    condition = () => true
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests unless explicitly configured otherwise
    if (req.method !== 'GET' && !options.cacheNonGetRequests) {
      return next();
    }

    // Skip caching based on custom condition
    if (!condition(req)) {
      return next();
    }

    // Generate cache key
    const key = keyGenerator(req, prefix);

    // Check if response exists in cache
    try {
      const cachedResponse = await getFromCache(key);
      
      if (cachedResponse) {
        // Add cache header to indicate cache hit
        res.set('X-Cache', 'HIT');
        
        // Return cached response
        return res.status(cachedResponse.status)
          .set(cachedResponse.headers)
          .send(cachedResponse.data);
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
      // Continue without caching if there's an error
    }

    // Add cache header to indicate cache miss
    res.set('X-Cache', 'MISS');

    // Store original send method
    const originalSend = res.send;

    // Override send method to cache the response
    res.send = async function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseToCache = {
          status: res.statusCode,
          data: body,
          headers: {
            'Content-Type': res.get('Content-Type')
          }
        };
        
        // Store response in cache
        try {
          await setInCache(key, responseToCache, ttl);
        } catch (error) {
          console.error('Cache storage error:', error);
          // Continue without caching if there's an error
        }
      }
      
      // Call original send method
      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Clear cache for a specific key pattern
 * @param {string} pattern - Pattern to match cache keys
 * @returns {Promise<number>} Number of keys removed
 */
export const clearCache = async (pattern = '') => {
  if (redisClient) {
    try {
      if (!pattern) {
        await redisClient.flushDb();
        return 1;
      }
      
      const keys = await redisClient.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error('Redis clear cache error:', error);
      // Fall back to local cache
    }
  }
  
  if (!pattern) {
    return cache.flushAll();
  }
  
  const keys = cache.keys();
  let count = 0;
  
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
      count++;
    }
  });
  
  return count;
};

/**
 * Middleware to clear cache based on request
 * @param {Object} options - Options for cache clearing
 * @param {string} options.pattern - Pattern to match cache keys
 * @param {Function} options.condition - Function to determine if cache should be cleared
 * @returns {Function} Express middleware function
 */
export const clearCacheMiddleware = (options = {}) => {
  const {
    pattern = '',
    condition = () => true
  } = options;
  
  return (req, res, next) => {
    // Skip cache clearing based on custom condition
    if (!condition(req)) {
      return next();
    }
    
    // Clear cache after response is sent
    res.on('finish', async () => {
      // Only clear cache for successful write operations
      if (
        (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') &&
        res.statusCode >= 200 && res.statusCode < 300
      ) {
        try {
          const count = await clearCache(pattern);
          if (config.isDev) {
            console.log(`Cleared ${count} cache entries matching pattern: ${pattern}`);
          }
        } catch (error) {
          console.error('Error clearing cache:', error);
        }
      }
    });
    
    next();
  };
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
export const getCacheStats = async () => {
  if (redisClient) {
    try {
      const info = await redisClient.info();
      const dbSize = await redisClient.dbSize();
      
      return {
        type: 'redis',
        keys: dbSize,
        info: info,
        memory: info.match(/used_memory_human:(\S+)/)?.[1] || 'unknown'
      };
    } catch (error) {
      console.error('Error getting Redis stats:', error);
      // Fall back to local cache stats
    }
  }
  
  return {
    type: 'memory',
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

/**
 * Middleware to add cache control headers
 * @param {Object} options - Cache control options
 * @param {string} options.type - Cache type: 'public', 'private', 'no-cache', 'no-store'
 * @param {number} options.maxAge - Max age in seconds
 * @returns {Function} Express middleware function
 */
export const cacheControl = (options = {}) => {
  const {
    type = 'private',
    maxAge = 0
  } = options;
  
  return (req, res, next) => {
    res.set('Cache-Control', `${type}, max-age=${maxAge}`);
    next();
  };
};

// Export cache instance for direct manipulation
export default {
  cache,
  redisClient,
  cacheMiddleware,
  clearCache,
  clearCacheMiddleware,
  getCacheStats,
  cacheControl,
  closeRedisConnection
};

      