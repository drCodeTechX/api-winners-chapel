require('dotenv').config();
const { Pool, Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Ensure password is always a string (pg requires this)
const dbPassword = process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '';

async function getClient() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: dbPassword,
    database: process.env.DB_NAME || 'church_website',
  });
  await client.connect();
  return client;
}

async function createDatabase() {
  // Connect to default 'postgres' database to create our database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: dbPassword,
    database: 'postgres', // Connect to default database
  });

  const dbName = process.env.DB_NAME || 'church_db';
  
  try {
    await client.connect();
    
    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created`);
    } else {
      console.log(`Database '${dbName}' already exists`);
    }
  } finally {
    await client.end();
  }
}

async function ensureMigrationsTable(client) {
  const migrationTableSql = await fs.readFile(
    path.join(MIGRATIONS_DIR, '004_create_migrations_table.sql'),
    'utf-8'
  );
  await client.query(migrationTableSql);
}

async function getExecutedMigrations(client) {
  try {
    const result = await client.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map(row => row.name);
  } catch (error) {
    return [];
  }
}

async function getMigrationFiles() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files
    .filter(file => file.endsWith('.sql') && !file.includes('004_create_migrations'))
    .sort();
}

async function runMigration(client, filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = await fs.readFile(filepath, 'utf-8');
  
  console.log(`Running migration: ${filename}`);
  
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`  ✓ Migration ${filename} completed`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`  ✗ Migration ${filename} failed:`, error.message);
    return false;
  }
}

async function migrate() {
  console.log('Starting database migrations...\n');
  
  // Create database if it doesn't exist
  await createDatabase();
  
  const client = await getClient();
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable(client);
    
    // Get list of executed migrations
    const executed = await getExecutedMigrations(client);
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    
    // Filter out already executed migrations
    const pending = migrationFiles.filter(file => !executed.includes(file));
    
    if (pending.length === 0) {
      console.log('All migrations are up to date!\n');
      return;
    }
    
    console.log(`Found ${pending.length} pending migration(s)\n`);
    
    // Run pending migrations
    for (const file of pending) {
      const success = await runMigration(client, file);
      if (!success) {
        console.error('\nMigration failed. Stopping.');
        process.exit(1);
      }
    }
    
    console.log('\nAll migrations completed successfully!');
  } finally {
    await client.end();
  }
}

async function rollback() {
  console.log('Rolling back last migration...\n');
  
  const client = await getClient();
  
  try {
    const result = await client.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      console.log('No migrations to roll back.');
      return;
    }
    
    const migrationName = result.rows[0].name;
    const tableName = migrationName.replace(/^\d+_create_(\w+)_table\.sql$/, '$1');
    
    await client.query('BEGIN');
    
    if (tableName && tableName !== migrationName) {
      console.log(`Dropping table: ${tableName}`);
      await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    }
    
    await client.query('DELETE FROM migrations WHERE name = $1', [migrationName]);
    await client.query('COMMIT');
    
    console.log(`✓ Rolled back: ${migrationName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error.message);
  } finally {
    await client.end();
  }
}

async function status() {
  console.log('Migration status:\n');
  
  try {
    const client = await getClient();
    
    try {
      const executed = await getExecutedMigrations(client);
      const migrationFiles = await getMigrationFiles();
      
      for (const file of migrationFiles) {
        const status = executed.includes(file) ? '✓' : '○';
        console.log(`  ${status} ${file}`);
      }
      
      console.log(`\n${executed.length}/${migrationFiles.length} migrations executed`);
    } finally {
      await client.end();
    }
  } catch (error) {
    console.log('Could not connect to database. Make sure your .env is configured.');
    console.log('Error:', error.message);
  }
}

// CLI handler
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'migrate':
    migrate().catch(console.error);
    break;
  case 'down':
  case 'rollback':
    rollback().catch(console.error);
    break;
  case 'status':
    status().catch(console.error);
    break;
  default:
    console.log('Usage: node migrate.js <command>');
    console.log('Commands:');
    console.log('  up, migrate   - Run pending migrations');
    console.log('  down, rollback - Roll back last migration');
    console.log('  status        - Show migration status');
}
