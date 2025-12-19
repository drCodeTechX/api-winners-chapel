# Database Configuration Guide

This guide explains how to set up and configure the PostgreSQL database for the Winners' Chapel Church API.

## Prerequisites

- PostgreSQL 13 or later
- Node.js 18 or later

## Environment Variables

Create a `.env` file in the `api` folder with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=church_db

# Other settings
PORT=8010
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-secret-key
```

## Setting Up a New Database

### Step 1: Create the PostgreSQL Database (Optional)

You can create the database manually using psql or pgAdmin:

```sql
CREATE DATABASE church_db;
```

Or let the migration script create it automatically (recommended).

### Step 2: Configure Environment Variables

Copy the example above to your `.env` file and update the values:

- `DB_HOST`: Your PostgreSQL server host (use `localhost` for local development)
- `DB_PORT`: PostgreSQL port (default is 5432)
- `DB_USER`: Your PostgreSQL username
- `DB_PASSWORD`: Your PostgreSQL password
- `DB_NAME`: Name for your database

### Step 3: Run Migrations

Run the migration command to create all necessary tables:

```bash
npm run db:migrate
```

This command will:
1. Create the database if it doesn't exist
2. Create the migrations tracking table
3. Run all pending migrations in order (with transaction support)

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run all pending migrations (creates tables) |
| `npm run db:rollback` | Roll back the last migration |
| `npm run db:status` | Show which migrations have been run |
| `npm run db:seed` | Create default admin user and insert sample data (posters, events, announcements) |
| `npm run db:clear` | Remove all data from tables |
| `npm run db:setup` | Run migrations AND seed data (full setup) |

## Quick Setup

For a fresh database with sample data, run:
```bash
npm run db:setup
```

This will:
1. Create all tables (migrations)
2. Create the default admin user
3. Insert sample posters, announcements, and events

## Admin Credentials

Admin credentials are hardcoded in the seed file and stored in the database. When you run `npm run db:seed`, a default admin user is created:

- **Email**: `admin@winnerschapel`
- **Password**: `admin123`

**These credentials are hardcoded in the seed file and NOT read from environment variables.** Every time you seed the database, this admin user will be created (if it doesn't already exist).

**Change this password immediately after first login!**

You can manage users through the admin dashboard at `/dashboard/users`.

## Database Tables

The following tables are created by the migrations:

### posters
Stores church posters for services, events, and monthly themes.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| title | VARCHAR(255) | Poster title |
| category | VARCHAR(20) | 'service', 'event', or 'theme' (with CHECK constraint) |
| image_url | VARCHAR(500) | URL to the poster image |
| description | TEXT | Optional description |
| is_active | BOOLEAN | Whether the poster is visible |
| display_order | INTEGER | Order for sorting |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### announcements
Stores church announcements.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| title | VARCHAR(255) | Announcement title |
| date | DATE | Announcement date |
| description | TEXT | Full announcement text |
| icon | VARCHAR(50) | Lucide icon name |
| badge | VARCHAR(100) | Badge text |
| badge_variant | VARCHAR(20) | 'default', 'secondary', or 'outline' |
| is_active | BOOLEAN | Whether the announcement is visible |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### events
Stores upcoming church events.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| title | VARCHAR(255) | Event title |
| date | DATE | Event date |
| time | VARCHAR(50) | Event time (e.g., "9:00 AM - 11:00 AM") |
| description | TEXT | Event description |
| image_url | VARCHAR(500) | URL to the event image |
| is_active | BOOLEAN | Whether the event is visible |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### users
Stores admin users for authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key |
| email | VARCHAR(255) | User email (unique) |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| name | VARCHAR(255) | Display name (optional) |
| role | VARCHAR(20) | 'admin' or 'super_admin' |
| must_change_password | BOOLEAN | Force password change on login |
| is_active | BOOLEAN | Whether user can log in |
| last_login | TIMESTAMP | Last successful login |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### migrations
Tracks which migrations have been executed.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment primary key |
| name | VARCHAR(255) | Migration filename |
| executed_at | TIMESTAMP | When the migration was run |

## Creating a New Migration

1. Create a new SQL file in `src/database/migrations/`
2. Name it with a sequential number prefix: `005_your_migration_name.sql`
3. Write your SQL statements (use PostgreSQL syntax)
4. Run `npm run db:migrate`

Example migration file:

```sql
-- Migration: Add featured column to events
-- Description: Allows marking events as featured

ALTER TABLE events ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
```

## Replicating the Development Database

To set up a new environment that matches your development database:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create your `.env` file with the appropriate database credentials.

3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Verify setup**:
   ```bash
   npm run db:status
   ```

All tables will be created with the correct schema. No data will be transferred - this creates an empty database with the same structure.

## Backing Up Data

To backup your database:

```bash
pg_dump -U your_username -h localhost church_db > backup.sql
```

To restore from a backup:

```bash
psql -U your_username -h localhost church_db < backup.sql
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL server is running
- Check that `DB_HOST` and `DB_PORT` are correct
- Verify your firewall allows connections on the PostgreSQL port (5432)

### Authentication Failed
- Double-check your `DB_USER` and `DB_PASSWORD`
- Ensure the user has permissions for the database
- Check your `pg_hba.conf` file for authentication settings

### Permission Denied
- Grant necessary permissions to your user:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE church_db TO your_username;
  ```

### Migration Failed
- Check the error message for details
- Run `npm run db:status` to see which migrations succeeded
- Fix any issues in the migration file
- Migrations are transactional, so failed migrations won't leave partial changes
- Run `npm run db:migrate` again

## API Endpoints for Posters

The API provides these endpoints for poster management:

- `GET /api/posters` - Get all active posters
- `GET /api/posters/:id` - Get a specific poster
- `GET /api/posters/category/:category` - Get posters by category
- `GET /api/posters/theme/latest` - Get the latest theme of the month poster
- `POST /api/posters` - Create a new poster (requires auth)
- `PUT /api/posters/:id` - Update a poster (requires auth)
- `DELETE /api/posters/:id` - Delete a poster (requires auth)

## PostgreSQL vs MySQL Differences

This project uses PostgreSQL-specific features:
- `SERIAL` for auto-incrementing IDs
- `CHECK` constraints for enum-like validation
- `$1, $2, ...` parameterized query syntax
- `CURRENT_DATE` and `CURRENT_TIMESTAMP` functions
- Transactional DDL (migrations are atomic)
