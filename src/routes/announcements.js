const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { validate, announcementSchema } = require('../lib/validation');
const { authMiddleware } = require('../middleware/auth');
const db = require('../lib/db');

const router = express.Router();

// GET /api/announcements - Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await db.getAnnouncements();
    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Could not load announcements. Please try again.' });
  }
});

// GET /api/announcements/:id - Get single announcement
router.get('/:id', async (req, res) => {
  try {
    const announcement = await db.getAnnouncementById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Could not load announcement. Please try again.' });
  }
});

// POST /api/announcements - Create announcement (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const validation = validate(announcementSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    const now = new Date().toISOString();
    const announcement = {
      id: `announcement-${uuidv4()}`,
      ...validation.data,
      createdAt: now,
      updatedAt: now
    };

    await db.createAnnouncement(announcement);

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Could not create announcement. Please try again.' });
  }
});

// PUT /api/announcements/:id - Update announcement (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const validation = validate(announcementSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    const updated = await db.updateAnnouncement(req.params.id, validation.data);

    if (!updated) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Could not update announcement. Please try again.' });
  }
});

// DELETE /api/announcements/:id - Delete announcement (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await db.deleteAnnouncement(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Could not delete announcement. Please try again.' });
  }
});

module.exports = router;


