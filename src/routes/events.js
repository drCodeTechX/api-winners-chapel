const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { validate, eventSchema } = require('../lib/validation');
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

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] GET /api/events - Fetching all events');
    const events = await db.getEvents();
    console.log('✅ [API ROUTE] GET /api/events - Returning', events.length, 'events');
    events.forEach((event, idx) => {
      console.log(`📤 [API ROUTE] Sending event ${idx + 1}:`, {
        id: event.id,
        title: event.title,
        imageUrl: event.imageUrl,
        imageUrlLength: event.imageUrl?.length
      });
    });
    res.json(events);
  } catch (error) {
    console.error('❌ [API ROUTE] Get events error:', error);
    res.status(500).json({ error: 'Could not load events. Please try again.' });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] GET /api/events/:id - Fetching event:', req.params.id);
    const event = await db.getEventById(req.params.id);

    if (!event) {
      console.log('❌ [API ROUTE] Event not found:', req.params.id);
      return res.status(404).json({ error: 'Event not found' });
    }

    console.log('✅ [API ROUTE] GET /api/events/:id - Returning event:', {
      id: event.id,
      title: event.title,
      imageUrl: event.imageUrl,
      imageUrlLength: event.imageUrl?.length
    });
    res.json(event);
  } catch (error) {
    console.error('❌ [API ROUTE] Get event error:', error);
    res.status(500).json({ error: 'Could not load event. Please try again.' });
  }
});

// POST /api/events - Create event (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const validation = validate(eventSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    const now = new Date().toISOString();
    const event = {
      id: `event-${uuidv4()}`,
      ...validation.data,
      createdAt: now,
      updatedAt: now
    };

    await db.createEvent(event);

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Could not create event. Please try again.' });
  }
});

// PUT /api/events/:id - Update event (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const validation = validate(eventSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    // Get existing event to check for old image
    const existing = await db.getEventById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // If image is being updated, delete the old one
    if (validation.data.imageUrl && existing.imageUrl && validation.data.imageUrl !== existing.imageUrl) {
      deleteImageFile(existing.imageUrl);
    }

    const updated = await db.updateEvent(req.params.id, validation.data);

    if (!updated) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Could not update event. Please try again.' });
  }
});

// DELETE /api/events/:id - Delete event (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await db.deleteEvent(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Could not delete event. Please try again.' });
  }
});

module.exports = router;




