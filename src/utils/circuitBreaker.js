import { CircuitBreaker } from 'opossum';
import logger from './logger.js';

/**
 * Create a circuit breaker for an external service call
 * @param {Function} fn - The function to wrap with circuit breaker
 * @param {Object} options - Circuit breaker options
 * @param {string} serviceName - Name of the service for logging
 * @returns {CircuitBreaker} Configured circuit breaker
 */
export const createCircuitBreaker = (fn, options = {}, serviceName = 'external-service') => {
  // Default options
  const defaultOptions = {
    timeout: 5000, // 5 seconds
    errorThresholdPercentage: 50, // 50% of requests fail
    resetTimeout: 30000, // 30 seconds
    rollingCountTimeout: 10000, // 10 seconds
    rollingCountBuckets: 10
  };

  // Merge options
  const circuitOptions = { ...defaultOptions, ...options };
  
  // Create circuit breaker
  const breaker = new CircuitBreaker(fn, circuitOptions);
  
  // Add event listeners
  breaker.on('open', () => {
    logger.warn(`Circuit breaker for ${serviceName} opened`, {
      service: serviceName,
      state: 'open'
    });
  });
  
  breaker.on('close', () => {
    logger.info(`Circuit breaker for ${serviceName} closed`, {
      service: serviceName,
      state: 'closed'
    });
  });
  
  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker for ${serviceName} half-open`, {
      service: serviceName,
      state: 'half-open'
    });
  });
  
  breaker.on('fallback', (result) => {
    logger.info(`Circuit breaker for ${serviceName} used fallback`, {
      service: serviceName,
      result
    });
  });
  
  return breaker;
};

/**
 * Example usage with an external API call
 * @param {string} url - API URL to call
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
 */
export const callExternalApi = async (url, options = {}) => {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}`);
  }
  
  return response.json();
};

// Example circuit breaker for an external API
export const externalApiBreaker = createCircuitBreaker(
  callExternalApi,
  {
    timeout: 3000, // 3 seconds
    errorThresholdPercentage: 30 // 30% of requests fail
  },
  'external-api'
);

export default {
  createCircuitBreaker,
  externalApiBreaker
};