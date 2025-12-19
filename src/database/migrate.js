require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'church_db',
    multipleStatements: true
  });
}

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  const dbName = process.env.DB_NAME || 'church_db';
  
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${dbName}' is ready`);
  } finally {
    await connection.end();
  }
}

async function ensureMigrationsTable(connection) {
  const migrationTableSql = await fs.readFile(
    path.join(MIGRATIONS_DIR, '004_create_migrations_table.sql'),
    'utf-8'
  );
  await connection.query(migrationTableSql);
}

async function getExecutedMigrations(connection) {
  try {
    const [rows] = await connection.query('SELECT name FROM migrations ORDER BY id');
    return rows.map(row => row.name);
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

async function runMigration(connection, filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = await fs.readFile(filepath, 'utf-8');
  
  console.log(`Running migration: ${filename}`);
  
  try {
    await connection.query(sql);
    await connection.query('INSERT INTO migrations (name) VALUES (?)', [filename]);
    console.log(`  ✓ Migration ${filename} completed`);
    return true;
  } catch (error) {
    console.error(`  ✗ Migration ${filename} failed:`, error.message);
    return false;
  }
}

async function migrate() {
  console.log('Starting database migrations...\n');
  
  // Create database if it doesn't exist
  await createDatabase();
  
  const connection = await getConnection();
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable(connection);
    
    // Get list of executed migrations
    const executed = await getExecutedMigrations(connection);
    
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
      const success = await runMigration(connection, file);
      if (!success) {
        console.error('\nMigration failed. Stopping.');
        process.exit(1);
      }
    }
    
    console.log('\nAll migrations completed successfully!');
  } finally {
    await connection.end();
  }
}

async function rollback() {
  console.log('Rolling back last migration...\n');
  
  const connection = await getConnection();
  
  try {
    const [rows] = await connection.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      console.log('No migrations to roll back.');
      return;
    }
    
    const migrationName = rows[0].name;
    const tableName = migrationName.replace(/^\d+_create_(\w+)_table\.sql$/, '$1');
    
    if (tableName && tableName !== migrationName) {
      console.log(`Dropping table: ${tableName}`);
      await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
    }
    
    await connection.query('DELETE FROM migrations WHERE name = ?', [migrationName]);
    console.log(`✓ Rolled back: ${migrationName}`);
  } finally {
    await connection.end();
  }
}

async function status() {
  console.log('Migration status:\n');
  
  try {
    const connection = await getConnection();
    
    try {
      const executed = await getExecutedMigrations(connection);
      const migrationFiles = await getMigrationFiles();
      
      for (const file of migrationFiles) {
        const status = executed.includes(file) ? '✓' : '○';
        console.log(`  ${status} ${file}`);
      }
      
      console.log(`\n${executed.length}/${migrationFiles.length} migrations executed`);
    } finally {
      await connection.end();
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

