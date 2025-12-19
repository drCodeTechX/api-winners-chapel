const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { validate, posterSchema } = require('../lib/validation');
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

// GET /api/posters - Get all posters
router.get('/', async (req, res) => {
  try {
    console.log('[POSTERS API] GET /api/posters');
    const posters = await db.getPosters();
    console.log(`[POSTERS API] Found ${posters.length} total posters`);
    res.json(posters);
  } catch (error) {
    console.error('[POSTERS API] Get posters error:', error);
    res.status(500).json({ error: 'Could not load posters. Please try again.' });
  }
});

// GET /api/posters/theme/latest - Get the latest theme of the month poster
router.get('/theme/latest', async (req, res) => {
  try {
    const poster = await db.getLatestThemePoster();

    if (!poster) {
      return res.status(404).json({ error: 'No theme poster found' });
    }

    res.json(poster);
  } catch (error) {
    console.error('Get latest theme poster error:', error);
    res.status(500).json({ error: 'Could not load theme poster. Please try again.' });
  }
});

// GET /api/posters/category/:category - Get posters by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`[POSTERS API] GET /api/posters/category/${category}`);

    const validCategories = ['service', 'event', 'theme'];

    if (!validCategories.includes(category)) {
      console.log(`[POSTERS API] Invalid category requested: ${category}`);
      return res.status(400).json({ error: 'Invalid category. Use: service, event, or theme' });
    }

    const posters = await db.getPostersByCategory(category);
    console.log(`[POSTERS API] Found ${posters.length} posters for category '${category}'`);

    if (posters.length > 0) {
      console.log('[POSTERS API] Sample poster data:', JSON.stringify(posters[0], null, 2));
    }

    res.json(posters);
  } catch (error) {
    console.error('[POSTERS API] Get posters by category error:', error);
    res.status(500).json({ error: 'Could not load posters. Please try again.' });
  }
});

// GET /api/posters/:id - Get single poster
router.get('/:id', async (req, res) => {
  try {
    const poster = await db.getPosterById(req.params.id);

    if (!poster) {
      return res.status(404).json({ error: 'Poster not found' });
    }

    res.json(poster);
  } catch (error) {
    console.error('Get poster error:', error);
    res.status(500).json({ error: 'Could not load poster. Please try again.' });
  }
});

// POST /api/posters - Create poster (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const validation = validate(posterSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    const now = new Date().toISOString();
    const poster = {
      id: `poster-${uuidv4()}`,
      ...validation.data,
      createdAt: now,
      updatedAt: now
    };

    const created = await db.createPoster(poster);

    res.status(201).json(created);
  } catch (error) {
    console.error('Create poster error:', error);
    res.status(500).json({ error: 'Could not create poster. Please try again.' });
  }
});

// PUT /api/posters/:id - Update poster (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const validation = validate(posterSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    // Get existing poster to check for old image
    const existing = await db.getPosterById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Poster not found' });
    }

    // If image is being updated, delete the old one
    if (validation.data.imageUrl && existing.imageUrl && validation.data.imageUrl !== existing.imageUrl) {
      deleteImageFile(existing.imageUrl);
    }

    const updated = await db.updatePoster(req.params.id, validation.data);

    if (!updated) {
      return res.status(404).json({ error: 'Poster not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update poster error:', error);
    res.status(500).json({ error: 'Could not update poster. Please try again.' });
  }
});

// DELETE /api/posters/:id - Delete poster (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await db.deletePoster(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Poster not found' });
    }

    res.json({ success: true, message: 'Poster deleted successfully' });
  } catch (error) {
    console.error('Delete poster error:', error);
    res.status(500).json({ error: 'Could not delete poster. Please try again.' });
  }
});

module.exports = router;
