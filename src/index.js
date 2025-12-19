require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database connection
const { testConnection } = require('./database/connection');

// Import routes
const authRoutes = require('./routes/auth');
const announcementsRoutes = require('./routes/announcements');
const eventsRoutes = require('./routes/events');
const postersRoutes = require('./routes/posters');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 8010;

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from public folder (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Serve static assets (images transferred from www)
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/posters', postersRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on our end. Please try again.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server and test database connection
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.warn('Warning: Database not connected. Some features may not work.');
    console.warn('Run "npm run db:migrate" to set up the database.');
  }
  
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Allowed origins: ${corsOrigins.join(', ')}`);
  });
}

startServer();
