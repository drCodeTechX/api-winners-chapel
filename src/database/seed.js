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

// Sample data for seeding
const samplePosters = [
  {
    title: 'Sunday Service',
    category: 'service',
    image_url: '/assets/posters/sunday-service.jpg',
    description: 'Join us every Sunday for worship and the Word'
  },
  {
    title: 'Midweek Service',
    category: 'service',
    image_url: '/assets/posters/midweek-service.jpg',
    description: 'Midweek power service - Wednesdays'
  },
  {
    title: 'Special Service',
    category: 'service',
    image_url: '/assets/posters/special-service.jpg',
    description: 'Special breakthrough service'
  },
  {
    title: 'Theme of the Month - December 2025',
    category: 'theme',
    image_url: '/assets/posters/theme-of-month.jpg',
    description: 'Walking in Divine Restoration'
  }
];

const sampleAnnouncements = [
  {
    title: 'Sunday Service Time Change',
    date: new Date().toISOString().split('T')[0],
    description: 'Please note that our Sunday services now begin at 8:00 AM and 10:30 AM.',
    icon: 'Clock',
    badge: 'Important',
    badge_variant: 'default'
  },
  {
    title: 'Bible Study Registration',
    date: new Date().toISOString().split('T')[0],
    description: 'Registration for the new Bible study group is now open. Sign up at the information desk.',
    icon: 'BookOpen',
    badge: 'New',
    badge_variant: 'secondary'
  }
];

const sampleEvents = [
  {
    title: 'Christmas Carol Service',
    date: '2025-12-24',
    time: '6:00 PM - 9:00 PM',
    description: 'Join us for a special evening of Christmas carols and celebration.',
    image_url: '/assets/events/christmas-carol.jpg'
  },
  {
    title: 'Crossover Night Service',
    date: '2025-12-31',
    time: '10:00 PM - 1:00 AM',
    description: 'End the year in the presence of God as we cross into the new year together.',
    image_url: '/assets/events/crossover-night.jpg'
  }
];

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

    // Seed admin user first
    await seedAdmin(client);

    // Seed posters
    console.log('Seeding posters...');
    for (const poster of samplePosters) {
      const id = `poster-${uuidv4()}`;
      await client.query(
        `INSERT INTO posters (id, title, category, image_url, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [id, poster.title, poster.category, poster.image_url, poster.description]
      );
    }
    console.log(`  ✓ Seeded ${samplePosters.length} posters`);

    // Seed announcements
    console.log('Seeding announcements...');
    for (const announcement of sampleAnnouncements) {
      const id = `announcement-${uuidv4()}`;
      await client.query(
        `INSERT INTO announcements (id, title, date, description, icon, badge, badge_variant, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [id, announcement.title, announcement.date, announcement.description, announcement.icon, announcement.badge, announcement.badge_variant]
      );
    }
    console.log(`  ✓ Seeded ${sampleAnnouncements.length} announcements`);

    // Seed events
    console.log('Seeding events...');
    for (const event of sampleEvents) {
      const id = `event-${uuidv4()}`;
      await client.query(
        `INSERT INTO events (id, title, date, time, description, image_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [id, event.title, event.date, event.time, event.description, event.image_url]
      );
    }
    console.log(`  ✓ Seeded ${sampleEvents.length} events`);

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

    await client.query('DELETE FROM posters');
    console.log('  ✓ Cleared posters');

    await client.query('DELETE FROM announcements');
    console.log('  ✓ Cleared announcements');

    await client.query('DELETE FROM events');
    console.log('  ✓ Cleared events');

    await client.query('DELETE FROM users');
    console.log('  ✓ Cleared users');

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
    console.log('  run, seed  - Insert admin user and sample data');
    console.log('  clear      - Remove all data from tables');
}
