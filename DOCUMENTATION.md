# API Project Documentation

## Overview

The API project is a Node.js/Express backend that serves as the central data layer for the church website. It provides RESTful endpoints for managing content (posters, events, announcements), user authentication, and file uploads.

**Technology Stack:**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- bcryptjs for password hashing

---

## Project Structure

```
api/
├── src/
│   ├── index.js              # Main server entry point
│   ├── database/
│   │   ├── connection.js     # PostgreSQL connection pool
│   │   ├── migrate.js        # Migration runner
│   │   ├── seed.js           # Database seeding
│   │   └── migrations/       # SQL migration files
│   ├── lib/
│   │   ├── db.js             # Database operations (CRUD)
│   │   └── validation.js     # Zod schema validation
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Authentication endpoints
│       ├── announcements.js  # Announcements CRUD
│       ├── events.js         # Events CRUD
│       ├── posters.js        # Posters CRUD
│       ├── upload.js         # File upload endpoint
│       └── users.js          # User management (super admin only)
└── public/
    ├── assets/               # Static images
    └── uploads/              # User-uploaded files
        ├── announcements/
        ├── events/
        └── posters/
```

---

## Database Architecture

### Database Connection

The API uses PostgreSQL with a connection pool for efficient database access:

```javascript
// Connection pool configuration
- Max connections: 10
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
```

**Connection Details:**
- Configured via environment variables (`.env`)
- Uses connection pooling for performance
- Automatically converts snake_case database columns to camelCase in responses

### Database Tables

#### 1. **users** Table
Stores admin user accounts for authentication.

**Schema:**
- `id` (VARCHAR) - Primary key, UUID format
- `email` (VARCHAR) - Unique email address
- `password_hash` (VARCHAR) - bcrypt hashed password
- `name` (VARCHAR) - Optional display name
- `role` (VARCHAR) - Either 'admin' or 'super_admin'
- `must_change_password` (BOOLEAN) - Flag for password reset
- `is_active` (BOOLEAN) - Account status
- `last_login` (TIMESTAMP) - Last login time
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_users_email` - Fast email lookups
- `idx_users_is_active` - Filter active users

#### 2. **posters** Table
Stores church posters for services, events, and monthly themes.

**Schema:**
- `id` (VARCHAR) - Primary key, UUID format
- `title` (VARCHAR) - Poster title
- `category` (VARCHAR) - 'service', 'event', or 'theme'
- `image_url` (VARCHAR) - Path to uploaded image
- `description` (TEXT) - Optional description
- `is_active` (BOOLEAN) - Visibility flag
- `display_order` (INTEGER) - Sorting order
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_posters_category` - Filter by category
- `idx_posters_is_active` - Filter active posters
- `idx_posters_created_at` - Sort by creation date

#### 3. **announcements** Table
Stores church announcements displayed on the website.

**Schema:**
- `id` (VARCHAR) - Primary key, UUID format
- `title` (VARCHAR) - Announcement title
- `date` (DATE) - Announcement date
- `description` (TEXT) - Full description
- `icon` (VARCHAR) - Lucide icon name
- `badge` (VARCHAR) - Badge text
- `badge_variant` (VARCHAR) - 'default', 'secondary', or 'outline'
- `is_active` (BOOLEAN) - Visibility flag
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_announcements_date` - Sort by date
- `idx_announcements_is_active` - Filter active announcements

#### 4. **events** Table
Stores upcoming church events.

**Schema:**
- `id` (VARCHAR) - Primary key, UUID format
- `title` (VARCHAR) - Event title
- `date` (DATE) - Event date
- `time` (VARCHAR) - Event time (e.g., "9:00 AM - 11:00 AM")
- `description` (TEXT) - Event description
- `image_url` (VARCHAR) - Path to event image
- `is_active` (BOOLEAN) - Visibility flag
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_events_date` - Sort by date (ascending for upcoming events)
- `idx_events_is_active` - Filter active events

---

## Database Operations (lib/db.js)

All database operations are centralized in `lib/db.js`. The module provides:

### Data Transformation
- **toCamelCase()** - Converts database snake_case to JavaScript camelCase
- **toCamelCaseArray()** - Converts arrays of rows

### CRUD Operations

#### Posters
- `getPosters()` - Get all active posters, sorted by display_order
- `getPosterById(id)` - Get single poster by ID
- `getPostersByCategory(category)` - Get posters filtered by category
- `getLatestThemePoster()` - Get the most recent theme poster
- `createPoster(poster)` - Create new poster
- `updatePoster(id, updates)` - Update existing poster (partial updates supported)
- `deletePoster(id)` - Delete poster

#### Announcements
- `getAnnouncements()` - Get all active announcements, sorted by date
- `getAnnouncementById(id)` - Get single announcement by ID
- `createAnnouncement(announcement)` - Create new announcement
- `updateAnnouncement(id, updates)` - Update existing announcement
- `deleteAnnouncement(id)` - Delete announcement

#### Events
- `getEvents()` - Get all active events, sorted by date
- `getEventById(id)` - Get single event by ID
- `getUpcomingEvents(limit)` - Get upcoming events (date >= today)
- `createEvent(event)` - Create new event
- `updateEvent(id, updates)` - Update existing event
- `deleteEvent(id)` - Delete event

#### Users
- `getUsers()` - Get all active users
- `getUserById(id)` - Get single user by ID
- `getUserByEmail(email)` - Get user by email (for login)
- `createUser(user)` - Create new user
- `updateUser(id, updates)` - Update user
- `updateLastLogin(id)` - Update last login timestamp
- `deleteUser(id)` - Deactivate user (soft delete)

---

## Authentication System

### JWT Token Generation
- Tokens expire after 24 hours
- Contains user ID, email, and role
- Signed with JWT_SECRET from environment

### Authentication Middleware
The `authMiddleware` function:
1. Extracts token from `Authorization: Bearer <token>` header
2. Verifies token signature and expiration
3. Attaches user payload to `req.user`
4. Returns 401 if token is missing or invalid

### Password Security
- Passwords are hashed using bcryptjs with salt rounds of 10
- Passwords are never returned in API responses
- Password comparison uses constant-time comparison

### Role-Based Access Control
- **admin** - Can manage content (posters, events, announcements)
- **super_admin** - Can manage content + users

---

## API Routes

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`
**Public endpoint** - Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "mustChangePassword": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Validation errors
- `401` - Invalid credentials

#### GET `/api/auth/me`
**Protected** - Returns current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-123",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "mustChangePassword": false,
  "isActive": true,
  "lastLogin": "2024-01-15T10:30:00Z"
}
```

#### PUT `/api/auth/profile`
**Protected** - Updates user profile (email, name).

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "name": "New Name"
}
```

**Response:**
```json
{
  "user": { /* updated user object */ },
  "token": "new-token-if-email-changed"
}
```

#### PUT `/api/auth/password`
**Protected** - Changes user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### POST `/api/auth/logout`
**Protected** - Logs out user (client-side token removal).

---

### Posters Routes (`/api/posters`)

#### GET `/api/posters`
**Public** - Returns all active posters.

**Response:**
```json
[
  {
    "id": "poster-123",
    "title": "Sunday Service",
    "category": "service",
    "imageUrl": "/uploads/posters/image.jpg",
    "description": "Join us for worship",
    "isActive": true,
    "displayOrder": 1,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

#### GET `/api/posters/:id`
**Public** - Returns single poster by ID.

#### GET `/api/posters/category/:category`
**Public** - Returns posters filtered by category (service, event, theme).

#### GET `/api/posters/theme/latest`
**Public** - Returns the most recent theme poster.

#### POST `/api/posters`
**Protected** - Creates new poster.

**Request Body:**
```json
{
  "title": "New Poster",
  "category": "service",
  "imageUrl": "/uploads/posters/image.jpg",
  "description": "Poster description"
}
```

#### PUT `/api/posters/:id`
**Protected** - Updates existing poster.

**Special Behavior:**
- If `imageUrl` is updated and different from existing, the old image file is deleted from the server

#### DELETE `/api/posters/:id`
**Protected** - Deletes poster (hard delete from database).

---

### Events Routes (`/api/events`)

#### GET `/api/events`
**Public** - Returns all active events, sorted by date.

#### GET `/api/events/:id`
**Public** - Returns single event by ID.

#### POST `/api/events`
**Protected** - Creates new event.

**Request Body:**
```json
{
  "title": "Thanksgiving Service",
  "date": "2024-12-25",
  "time": "9:00 AM - 11:00 AM",
  "description": "Join us for thanksgiving",
  "imageUrl": "/uploads/events/image.jpg"
}
```

#### PUT `/api/events/:id`
**Protected** - Updates existing event.

**Special Behavior:**
- If `imageUrl` is updated and different from existing, the old image file is deleted from the server

#### DELETE `/api/events/:id`
**Protected** - Deletes event.

---

### Announcements Routes (`/api/announcements`)

#### GET `/api/announcements`
**Public** - Returns all active announcements, sorted by date.

#### GET `/api/announcements/:id`
**Public** - Returns single announcement by ID.

#### POST `/api/announcements`
**Protected** - Creates new announcement.

**Request Body:**
```json
{
  "title": "Church Announcement",
  "date": "2024-01-20",
  "description": "Important announcement",
  "icon": "Bell",
  "badge": "New",
  "badgeVariant": "default"
}
```

#### PUT `/api/announcements/:id`
**Protected** - Updates existing announcement.

#### DELETE `/api/announcements/:id`
**Protected** - Deletes announcement.

---

### Upload Route (`/api/upload`)

#### POST `/api/upload`
**Protected** - Uploads image file.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `file` - Image file (JPEG, PNG, WebP)
  - `category` - 'posters', 'events', or 'announcements'

**File Validation:**
- Allowed types: image/jpeg, image/jpg, image/png, image/webp
- Max size: 10MB
- Files are stored in `public/uploads/{category}/`

**Response:**
```json
{
  "success": true,
  "url": "/uploads/posters/uuid-filename.jpg",
  "filename": "uuid-filename.jpg"
}
```

**Error Responses:**
- `400` - Invalid file type or size exceeded
- `401` - Not authenticated

---

### Users Routes (`/api/users`)

**All endpoints require super_admin role.**

#### GET `/api/users`
**Protected, Super Admin Only** - Returns all users.

#### GET `/api/users/:id`
**Protected, Super Admin Only** - Returns single user.

#### POST `/api/users`
**Protected, Super Admin Only** - Creates new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "admin"
}
```

#### PUT `/api/users/:id`
**Protected, Super Admin Only** - Updates user.

#### DELETE `/api/users/:id`
**Protected, Super Admin Only** - Deactivates user (sets is_active = false).

---

## Data Validation

All API endpoints use Zod schema validation via `lib/validation.js`:

- **Input validation** - Validates request body before processing
- **Type safety** - Ensures data types match expected schema
- **Error messages** - Returns detailed validation errors

**Validation Schemas:**
- `loginSchema` - Email and password validation
- `posterSchema` - Poster creation/update validation
- `eventSchema` - Event creation/update validation
- `announcementSchema` - Announcement creation/update validation

---

## File Management

### Image Upload Flow
1. Client sends file via multipart/form-data
2. Multer validates file type and size
3. File is saved to `public/uploads/{category}/` with UUID filename
4. API returns file URL path
5. Client stores URL in database record

### Image Deletion
When updating posters or events with new images:
1. API checks if `imageUrl` has changed
2. If changed, deletes old image file from filesystem
3. Saves new image URL to database

**File Paths:**
- Posters: `public/uploads/posters/{filename}`
- Events: `public/uploads/events/{filename}`
- Announcements: `public/uploads/announcements/{filename}`

---

## Error Handling

### Standard Error Responses

**400 Bad Request:**
```json
{
  "error": "Please check your input",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Your session has expired. Please log in again."
}
```

**403 Forbidden:**
```json
{
  "error": "You don't have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "error": "Event not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Could not create event. Please try again."
}
```

---

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (WWW project)
- `http://localhost:3001` (Admin project)
- Additional origins can be configured via `CORS_ORIGINS` environment variable

**CORS Settings:**
- Credentials: enabled
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

---

## Environment Variables

Required environment variables (`.env` file):

```env
# Server
PORT=8010
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=church_db

# Security
JWT_SECRET=your-super-secret-key-change-this-in-production
```

---

## Database Migrations

Migrations are managed via `src/database/migrate.js`:

**Available Commands:**
- `npm run db:migrate` - Run all pending migrations
- `npm run db:rollback` - Rollback last migration
- `npm run db:status` - Show migration status

**Migration Files:**
1. `001_create_posters_table.sql` - Creates posters table
2. `002_create_announcements_table.sql` - Creates announcements table
3. `003_create_events_table.sql` - Creates events table
4. `004_create_migrations_table.sql` - Creates migrations tracking table
5. `005_create_users_table.sql` - Creates users table

---

## Database Seeding

Seed data can be loaded via `src/database/seed.js`:

**Available Commands:**
- `npm run db:seed` - Seed sample data
- `npm run db:clear` - Clear all data
- `npm run db:setup` - Run migrations + seed (full setup)

**Default Seed Data:**
- Creates admin user: `admin@winnerschapel.com` / `admin123`
- Creates sample posters, events, and announcements

---

## Security Considerations

1. **Password Hashing** - All passwords are hashed with bcrypt before storage
2. **JWT Tokens** - Tokens expire after 24 hours
3. **Input Validation** - All inputs are validated with Zod schemas
4. **SQL Injection Prevention** - Uses parameterized queries (PostgreSQL $1, $2, etc.)
5. **File Upload Security** - Validates file types and sizes
6. **Role-Based Access** - Super admin routes are protected
7. **CORS** - Restricted to known origins

---

## Performance Optimizations

1. **Connection Pooling** - Reuses database connections
2. **Database Indexes** - Fast queries on common filters (category, date, is_active)
3. **Efficient Queries** - Uses COALESCE for partial updates
4. **Static File Serving** - Express serves static files directly

---

## API Response Format

All successful responses return data in camelCase (converted from database snake_case).

**Single Resource:**
```json
{
  "id": "resource-123",
  "title": "Resource Title",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Array of Resources:**
```json
[
  { "id": "1", "title": "First" },
  { "id": "2", "title": "Second" }
]
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": [ /* validation errors */ ]
}
```

