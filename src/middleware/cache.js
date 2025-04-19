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

  return (req, res, next) => {
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
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      // Add cache header to indicate cache hit
      res.set('X-Cache', 'HIT');
      
      // Return cached response
      return res.status(cachedResponse.status)
        .set(cachedResponse.headers)
        .send(cachedResponse.data);
    }

    // Add cache header to indicate cache miss
    res.set('X-Cache', 'MISS');

    // Store original send method
    const originalSend = res.send;

    // Override send method to cache the response
    res.send = function(body) {
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
        cache.set(key, responseToCache, ttl);
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
 * @returns {number} Number of keys removed
 */
export const clearCache = (pattern = '') => {
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
    res.on('finish', () => {
      // Only clear cache for successful write operations
      if (
        (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') &&
        res.statusCode >= 200 && res.statusCode < 300
      ) {
        const count = clearCache(pattern);
        if (config.isDev) {
          console.log(`Cleared ${count} cache entries matching pattern: ${pattern}`);
        }
      }
    });
    
    next();
  };
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return {
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
  cacheMiddleware,
  clearCache,
  clearCacheMiddleware,
  getCacheStats,
  cacheControl
};