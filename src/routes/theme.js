const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { validate, themeSchema } = require('../lib/validation');
const { authMiddleware } = require('../middleware/auth');
const db = require('../lib/db');

const router = express.Router();

// Helper function to delete old image file
function deleteImageFile(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
    return;
  }
  
  try {
    const filePath = path.join(__dirname, '..', '..', 'public', imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old image: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting image file ${imageUrl}:`, error);
    // Don't throw - image deletion failure shouldn't break the update
  }
}

// GET /api/theme - Get all themes
router.get('/', async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] GET /api/theme - Fetching all themes');
    const themes = await db.getThemes();
    console.log('✅ [API ROUTE] GET /api/theme - Returning', themes.length, 'themes');
    themes.forEach((theme, idx) => {
      console.log(`📤 [API ROUTE] Sending theme ${idx + 1}:`, {
        id: theme.id,
        title: theme.title,
        posterPath: theme.posterPath,
        posterPathLength: theme.posterPath?.length
      });
    });
    res.json(themes);
  } catch (error) {
    console.error('❌ [API ROUTE] Get themes error:', error);
    res.status(500).json({ error: 'Could not load themes. Please try again.' });
  }
});

// GET /api/theme/latest - Get the latest theme
router.get('/latest', async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] GET /api/theme/latest - Fetching latest theme');
    const theme = await db.getLatestTheme();

    if (!theme) {
      console.log('❌ [API ROUTE] No theme found');
      return res.status(404).json({ error: 'No theme found' });
    }

    console.log('✅ [API ROUTE] GET /api/theme/latest - Returning theme:', {
      id: theme.id,
      title: theme.title,
      posterPath: theme.posterPath,
      posterPathLength: theme.posterPath?.length,
      posterPathPreview: theme.posterPath?.substring(0, 50)
    });
    res.json(theme);
  } catch (error) {
    console.error('❌ [API ROUTE] Get latest theme error:', error);

    // Check if it's a table doesn't exist error (common during migration)
    if (error.message && error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Theme table not found. Please run database migrations.' });
    }

    // For other errors, return 404 instead of 500 to handle gracefully on frontend
    res.status(404).json({ error: 'No theme available at this time.' });
  }
});

// GET /api/theme/:id - Get single theme
router.get('/:id', async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] GET /api/theme/:id - Fetching theme:', req.params.id);
    const theme = await db.getThemeById(req.params.id);

    if (!theme) {
      console.log('❌ [API ROUTE] Theme not found:', req.params.id);
      return res.status(404).json({ error: 'Theme not found' });
    }

    console.log('✅ [API ROUTE] GET /api/theme/:id - Returning theme:', {
      id: theme.id,
      title: theme.title,
      posterPath: theme.posterPath,
      posterPathLength: theme.posterPath?.length
    });
    res.json(theme);
  } catch (error) {
    console.error('❌ [API ROUTE] Get theme error:', error);
    res.status(500).json({ error: 'Could not load theme. Please try again.' });
  }
});

// POST /api/theme - Create theme (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const validation = validate(themeSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    const now = new Date().toISOString();
    const theme = {
      id: `theme-${uuidv4()}`,
      ...validation.data,
      createdAt: now,
      updatedAt: now
    };

    await db.createTheme(theme);

    res.status(201).json(theme);
  } catch (error) {
    console.error('Create theme error:', error);
    res.status(500).json({ error: 'Could not create theme. Please try again.' });
  }
});

// PUT /api/theme/:id - Update theme (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const validation = validate(themeSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    // Get existing theme to check for old image
    const existing = await db.getThemeById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // If poster path is being updated, delete the old one
    if (validation.data.posterPath && existing.posterPath && validation.data.posterPath !== existing.posterPath) {
      deleteImageFile(existing.posterPath);
    }

    const updated = await db.updateTheme(req.params.id, validation.data);

    if (!updated) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Could not update theme. Please try again.' });
  }
});

// DELETE /api/theme/:id - Delete theme (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Get existing theme to delete associated image
    const existing = await db.getThemeById(req.params.id);
    
    const deleted = await db.deleteTheme(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Delete associated image file
    if (existing && existing.posterPath) {
      deleteImageFile(existing.posterPath);
    }

    res.json({ success: true, message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({ error: 'Could not delete theme. Please try again.' });
  }
});

module.exports = router;

