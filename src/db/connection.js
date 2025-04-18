import pg from 'pg';
import config from '../../config/config.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Create a connection pool
const pool = new Pool({
  user: config.db.user,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  max: config.db.poolSize,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false
});

// Log pool events
pool.on('connect', () => {
  logger.debug('New client connected to PostgreSQL pool');
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
  // Don't exit in production, just log the error
  if (config.env !== 'production') {
    process.exit(-1);
  }
});

// Export query methods
export default {
  /**
   * Execute a SQL query with optional parameters
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  query: (text, params) => {
    logger.debug('Executing query', { query: text, params });
    return pool.query(text, params);
  },
  
  /**
   * Get a client from the pool for transactions
   * @returns {Promise<Object>} Client with query and release methods
   */
  getClient: async () => {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    
    // Wrap query method to add logging
    client.query = async (text, params) => {
      logger.debug('Executing transaction query', { query: text, params });
      return originalQuery(text, params);
    };
    
    return {
      query: client.query,
      release: () => {
        logger.debug('Releasing client back to pool');
        client.release();
      },
      begin: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK')
    };
  },
  
  /**
   * End the pool (for graceful shutdown)
   */
  end: () => pool.end()
};