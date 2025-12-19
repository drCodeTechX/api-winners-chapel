# Winners' Chapel API

Backend API server for Winners' Chapel International Congo Town Liberia church website and admin portal.

## Overview

This Express.js API provides RESTful endpoints for managing church content including announcements, events, and posters. It handles authentication via JWT tokens and file uploads for media content.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **File Upload**: Multer
- **Database**: JSON file-based storage

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

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

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production

# Admin Credentials
ADMIN_EMAIL=admin@winnerschapel
ADMIN_PASSWORD=admin123

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Running the Server

```bash
# Development (with auto-reload)
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
| POST | `/api/auth/logout` | Yes | Logout (invalidate token client-side) |
| GET | `/api/auth/me` | Yes | Get current user info |

**Login Request:**
```json
{
  "email": "admin@winnerschapel",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "success": true,
  "email": "admin@winnerschapel",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Announcements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/announcements` | No | Get all announcements |
| GET | `/api/announcements/:id` | No | Get single announcement |
| POST | `/api/announcements` | Yes | Create announcement |
| PUT | `/api/announcements/:id` | Yes | Update announcement |
| DELETE | `/api/announcements/:id` | Yes | Delete announcement |

**Announcement Schema:**
```json
{
  "title": "Christmas Carol Service",
  "date": "2025-12-24",
  "description": "Join us for a special Christmas Eve service",
  "icon": "Gift",
  "badge": "Upcoming",
  "badgeVariant": "default"
}
```

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | No | Get all events |
| GET | `/api/events/:id` | No | Get single event |
| POST | `/api/events` | Yes | Create event |
| PUT | `/api/events/:id` | Yes | Update event |
| DELETE | `/api/events/:id` | Yes | Delete event |

**Event Schema:**
```json
{
  "title": "Annual Thanksgiving Service",
  "date": "2025-12-15",
  "time": "9:00 AM - 1:00 PM",
  "description": "Join us as we give thanks to God",
  "imageUrl": "/uploads/events/image.jpg"
}
```

### Posters

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posters` | No | Get all posters |
| GET | `/api/posters/:id` | No | Get single poster |
| POST | `/api/posters` | Yes | Create poster |
| PUT | `/api/posters/:id` | Yes | Update poster |
| DELETE | `/api/posters/:id` | Yes | Delete poster |

**Poster Schema:**
```json
{
  "title": "Sunday Service Poster",
  "category": "service",
  "imageUrl": "/uploads/posters/image.jpg",
  "description": "Optional description"
}
```

**Category options:** `service`, `event`, `theme`

### File Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | Yes | Upload image file |

**Request:** `multipart/form-data`
- `file`: Image file (JPEG, PNG, WebP - max 5MB)
- `category`: Upload category (`posters`, `events`, `announcements`)

**Response:**
```json
{
  "success": true,
  "url": "/uploads/posters/abc123.jpg",
  "filename": "abc123.jpg"
}
```

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens expire after 24 hours. To get a new token, call the login endpoint.

## File Storage

Uploaded files are stored in `public/uploads/` with subdirectories:
- `public/uploads/posters/` - Poster images
- `public/uploads/events/` - Event images
- `public/uploads/announcements/` - Announcement images

Files are served statically at `/uploads/*`

## Data Storage

Data is stored in JSON files in the `data/` directory:
- `data/announcements.json`
- `data/events.json`
- `data/posters.json`

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

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Project Structure

```
api/
├── src/
│   ├── index.js           # Server entry point
│   ├── routes/
│   │   ├── auth.js        # Auth endpoints
│   │   ├── announcements.js
│   │   ├── events.js
│   │   ├── posters.js
│   │   └── upload.js      # File upload
│   ├── middleware/
│   │   └── auth.js        # JWT verification
│   └── lib/
│       ├── db.js          # JSON file operations
│       └── validation.js  # Zod schemas
├── data/                  # JSON data storage
├── public/
│   └── uploads/           # Uploaded files
├── .env                   # Environment variables
└── package.json
```

## CORS

The API is configured to accept requests from:
- `http://localhost:3000` (WWW frontend)
- `http://localhost:3001` (Admin portal)

Additional origins can be added via the `CORS_ORIGINS` environment variable.

## Development

```bash
# Run with nodemon (auto-reload on file changes)
npm run dev

# Run tests (coming soon)
npm test
```

## License

ISC




