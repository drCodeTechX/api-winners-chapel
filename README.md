# Winners' Chapel API

Backend API server for Winners' Chapel International Congo Town, Monrovia, Liberia church website and admin portal.

## Overview

Express.js REST API providing endpoints for managing church content including announcements, events, posters, and user authentication. Uses PostgreSQL for data persistence and JWT for secure authentication.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Database**: PostgreSQL 13+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod schemas
- **File Upload**: Multer
- **Image Processing**: Sharp

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 13 or higher
- npm or yarn

### Installation

```bash
cd api
npm install
```

### Configuration

Create a `.env` file in the `api` directory:

```env
# Server Configuration
PORT=8010

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=church_db

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Database Setup

```bash
# Run migrations to create tables
npm run db:migrate

# Seed with default admin user and sample data
npm run db:seed

# Or do both in one command
npm run db:setup
```

**Default Admin Credentials** (created by seed):
- Email: admin@winnerschapel
- Password: admin123

> **Important**: Change this password immediately in production!

### Running the Server

```bash
# Development (with auto-reload via nodemon)
npm run dev

# Production
npm start
```

The server will start at `http://localhost:8010`

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with email/password, returns JWT |
| POST | `/api/auth/logout` | Yes | Logout (client-side token removal) |
| GET | `/api/auth/me` | Yes | Get current user info |
| PUT | `/api/auth/profile` | Yes | Update user profile (email, name) |
| PUT | `/api/auth/password` | Yes | Change password |

### Announcements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/announcements` | No | Get all active announcements |
| GET | `/api/announcements/:id` | No | Get single announcement |
| POST | `/api/announcements` | Yes | Create announcement |
| PUT | `/api/announcements/:id` | Yes | Update announcement |
| DELETE | `/api/announcements/:id` | Yes | Delete announcement |

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | No | Get all active events |
| GET | `/api/events/:id` | No | Get single event |
| POST | `/api/events` | Yes | Create event |
| PUT | `/api/events/:id` | Yes | Update event |
| DELETE | `/api/events/:id` | Yes | Delete event |

### Posters

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posters` | No | Get all active posters |
| GET | `/api/posters/:id` | No | Get single poster |
| GET | `/api/posters/category/:category` | No | Get posters by category |
| GET | `/api/posters/theme/latest` | No | Get latest theme poster |
| POST | `/api/posters` | Yes | Create poster |
| PUT | `/api/posters/:id` | Yes | Update poster |
| DELETE | `/api/posters/:id` | Yes | Delete poster |

### Users (Super Admin Only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Super Admin | Get all users |
| GET | `/api/users/:id` | Super Admin | Get single user |
| POST | `/api/users` | Super Admin | Create user |
| PUT | `/api/users/:id` | Super Admin | Update user |
| DELETE | `/api/users/:id` | Super Admin | Deactivate user |

### File Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | Yes | Upload image file |

**Request**: `multipart/form-data`
- `file`: Image file (JPEG, PNG, WebP - max 10MB)
- `category`: Upload category (`posters`, `events`, `announcements`)

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are issued on login and expire after 24 hours.

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:rollback` | Rollback last migration |
| `npm run db:status` | Show migration status |
| `npm run db:seed` | Insert sample data and default admin |
| `npm run db:clear` | Remove all data from tables |
| `npm run db:setup` | Run migrations + seed (full setup) |

## File Storage

Uploaded files are stored in `public/uploads/` with subdirectories:
- `public/uploads/posters/` - Poster images
- `public/uploads/events/` - Event images
- `public/uploads/announcements/` - Announcement images (future use)

Files are served statically at `/uploads/*`

## Project Structure

```
api/
├── src/
│   ├── index.js              # Server entry point
│   ├── database/
│   │   ├── connection.js     # PostgreSQL connection pool
│   │   ├── migrate.js        # Migration runner
│   │   ├── seed.js           # Database seeding
│   │   └── migrations/       # SQL migration files
│   ├── lib/
│   │   ├── db.js             # Database CRUD operations
│   │   └── validation.js     # Zod validation schemas
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   └── routes/
│       ├── auth.js           # Authentication endpoints
│       ├── announcements.js  # Announcements CRUD
│       ├── events.js         # Events CRUD
│       ├── posters.js        # Posters CRUD
│       ├── upload.js         # File upload endpoint
│       └── users.js          # User management
├── public/
│   ├── assets/               # Static images
│   └── uploads/              # User-uploaded files
├── .env                      # Environment variables (gitignored)
├── package.json
└── README.md
```

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Error message here",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

**Common Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## CORS Configuration

The API accepts requests from:
- `http://localhost:3000` (WWW frontend)
- `http://localhost:3001` (Admin portal)

Additional origins can be added via `CORS_ORIGINS` environment variable (comma-separated).

## Security Features

1. **Password Hashing** - bcrypt with salt rounds of 10
2. **JWT Tokens** - 24-hour expiration
3. **Input Validation** - Zod schema validation on all inputs
4. **SQL Injection Prevention** - Parameterized queries ($1, $2, etc.)
5. **File Upload Validation** - Type and size restrictions
6. **Role-Based Access** - Super admin protected routes
7. **CORS** - Restricted to known origins

## Example Requests

### Login

```bash
curl -X POST http://localhost:8010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@winnerschapel","password":"admin123"}'
```

### Create Event (Authenticated)

```bash
curl -X POST http://localhost:8010/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Youth Conference",
    "date": "2025-12-31",
    "time": "6:00 PM - 9:00 PM",
    "description": "Annual youth conference",
    "imageUrl": "/uploads/events/conference.jpg"
  }'
```

### Upload Image

```bash
curl -X POST http://localhost:8010/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/image.jpg" \
  -F "category=events"
```

## Documentation

For detailed technical documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)

For database configuration guide, see [database-config.md](./database-config.md)

## Development

```bash
# Install dependencies
npm install

# Run with nodemon (auto-reload on file changes)
npm run dev

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

## Production Deployment

1. Set environment variables securely
2. Use a strong `JWT_SECRET`
3. Change default admin credentials
4. Configure PostgreSQL with production settings
5. Set up HTTPS/SSL
6. Configure firewall rules
7. Set up database backups
8. Monitor server logs

## License

ISC
