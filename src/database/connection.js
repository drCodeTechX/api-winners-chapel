const { Pool } = require('pg');

// Ensure password is always a string (pg requires this)
const dbPassword = process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '';

// Create a connection pool for efficient database connections
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: dbPassword,
  database: process.env.DB_NAME || 'church_website',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
