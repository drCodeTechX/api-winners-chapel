require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Ensure password is always a string (pg requires this)
const dbPassword = process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: dbPassword,
  database: process.env.DB_NAME || 'church_website',
});

// Hash password helper
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Default admin user
const defaultAdmin = {
  email: 'admin@winnerschapel',
  password: 'admin123',
  name: 'Admin',
  role: 'super_admin'
};

async function seedAdmin(client) {
  console.log('Seeding admin user...');
  
  // Check if admin already exists
  const existing = await client.query(
    'SELECT id FROM users WHERE email = $1',
    [defaultAdmin.email]
  );
  
  if (existing.rows.length > 0) {
    console.log('  ○ Admin user already exists, skipping');
    return;
  }
  
  const id = `user-${uuidv4()}`;
  const passwordHash = await hashPassword(defaultAdmin.password);
  
  await client.query(
    `INSERT INTO users (id, email, password_hash, name, role, must_change_password, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NOW(), NOW())`,
    [id, defaultAdmin.email, passwordHash, defaultAdmin.name, defaultAdmin.role]
  );
  
  console.log(`  ✓ Created admin user: ${defaultAdmin.email}`);
}

async function seed() {
  console.log('Starting database seeding...\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Seed admin user only
    await seedAdmin(client);

    await client.query('COMMIT');
    console.log('\n✓ Database seeding completed successfully!');
    console.log(`\nDefault admin credentials:`);
    console.log(`  Email: ${defaultAdmin.email}`);
    console.log(`  Password: ${defaultAdmin.password}`);
    console.log(`\nPlease change these credentials after first login!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function clear() {
  console.log('Clearing all data from tables...\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM users');
    console.log('  ✓ Cleared users');

    await client.query('DELETE FROM posters');
    console.log('  ✓ Cleared posters');

    await client.query('DELETE FROM announcements');
    console.log('  ✓ Cleared announcements');

    await client.query('DELETE FROM events');
    console.log('  ✓ Cleared events');

    await client.query('COMMIT');
    console.log('\n✓ All data cleared successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Clear failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// CLI handler
const command = process.argv[2];

switch (command) {
  case 'run':
  case 'seed':
    seed();
    break;
  case 'clear':
    clear();
    break;
  default:
    console.log('Usage: node seed.js <command>');
    console.log('Commands:');
    console.log('  run, seed  - Insert admin user credentials only');
    console.log('  clear      - Remove all data from tables');
}
