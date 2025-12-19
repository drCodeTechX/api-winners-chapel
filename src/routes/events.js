const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { validate, eventSchema } = require('../lib/validation');
const { authMiddleware } = require('../middleware/auth');
const db = require('../lib/db');

const router = express.Router();

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await db.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Could not load events. Please try again.' });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await db.getEventById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
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


