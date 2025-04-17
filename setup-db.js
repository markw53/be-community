import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

// Read the SQL file
const setupSQL = fs.readFileSync(path.join(__dirname, '/src/db/setup.sql'), 'utf8');

// Function to handle database creation/dropping
async function setupDatabaseStructure() {
  // Connect to the default postgres database
  const pgClient = new pg.Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres' // Connect to default database
  });
  
  try {
    await pgClient.connect();
    console.log('Connected to default postgres database');
    
    // Check if we need to recreate the database
    const recreateDb = process.env.RECREATE_DB === 'true';
    
    if (recreateDb) {
      // Terminate all connections to the database
      console.log(`Terminating all connections to ${DB_NAME}...`);
      await pgClient.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${DB_NAME}'
        AND pid <> pg_backend_pid();
      `);
      
      // Drop the database if it exists
      console.log(`Dropping database ${DB_NAME} if it exists...`);
      await pgClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    }
    
    // Check if database exists
    const dbCheckResult = await pgClient.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [DB_NAME]);
    
    // Create the database if it doesn't exist
    if (dbCheckResult.rows.length === 0) {
      console.log(`Creating database ${DB_NAME}...`);
      await pgClient.query(`CREATE DATABASE ${DB_NAME}`);
    } else {
      console.log(`Database ${DB_NAME} already exists.`);
    }
    
    return true;
  } catch (err) {
    console.error('Error setting up database structure:', err.message);
    return false;
  } finally {
    await pgClient.end();
  }
}

// Function to set up schema and tables
async function setupSchema() {
  // Connect to the specific database
  const client = new pg.Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME
  });
  
  try {
    await client.connect();
    console.log(`Connected to ${DB_NAME} database`);
    
    // Split the SQL file to remove any DROP DATABASE or CREATE DATABASE statements
    const schemaSQL = setupSQL
      .split(';')
      .filter(statement => {
        const normalized = statement.trim().toUpperCase();
        return !normalized.includes('DROP DATABASE') && 
               !normalized.includes('CREATE DATABASE');
      })
      .join(';');
    
    // Execute the schema setup SQL
    await client.query(schemaSQL);
    console.log('Schema setup completed successfully');
    
    return true;
  } catch (err) {
    console.error('Error setting up schema:', err.message);
    return false;
  } finally {
    await client.end();
  }
}

// Main function
async function main() {
  console.log('Starting database setup...');
  
  // First set up the database structure
  const dbStructureSuccess = await setupDatabaseStructure();
  
  if (!dbStructureSuccess) {
    console.error('Failed to set up database structure. Exiting.');
    process.exit(1);
  }
  
  // Then set up the schema
  const schemaSuccess = await setupSchema();
  
  if (!schemaSuccess) {
    console.error('Failed to set up schema. Exiting.');
    process.exit(1);
  }
  
  console.log('Database setup completed successfully!');
}

main();