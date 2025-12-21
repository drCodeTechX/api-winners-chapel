const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { validate, serviceSchema } = require('../lib/validation');
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

// GET /api/services - Get all services
router.get('/', async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] GET /api/services - Fetching all services');
    const services = await db.getServices();
    console.log('✅ [API ROUTE] GET /api/services - Returning', services.length, 'services');
    services.forEach((service, idx) => {
      console.log(`📤 [API ROUTE] Sending service ${idx + 1}:`, {
        id: service.id,
        title: service.title,
        imageUrl: service.imageUrl,
        imageUrlLength: service.imageUrl?.length
      });
    });
    res.json(services);
  } catch (error) {
    console.error('❌ [API ROUTE] Get services error:', error);
    res.status(500).json({ error: 'Could not load services. Please try again.' });
  }
});

// GET /api/services/:id - Get single service
router.get('/:id', async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] GET /api/services/:id - Fetching service:', req.params.id);
    const service = await db.getServiceById(req.params.id);

    if (!service) {
      console.log('❌ [API ROUTE] Service not found:', req.params.id);
      return res.status(404).json({ error: 'Service not found' });
    }

    console.log('✅ [API ROUTE] GET /api/services/:id - Returning service:', {
      id: service.id,
      title: service.title,
      imageUrl: service.imageUrl,
      imageUrlLength: service.imageUrl?.length
    });
    res.json(service);
  } catch (error) {
    console.error('❌ [API ROUTE] Get service error:', error);
    res.status(500).json({ error: 'Could not load service. Please try again.' });
  }
});

// POST /api/services - Create service (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('🌐 [API ROUTE] POST /api/services - Creating service with data:', {
      title: req.body.title,
      imageUrl: req.body.imageUrl,
      imageUrlLength: req.body.imageUrl?.length
    });

    const validation = validate(serviceSchema, req.body);

    if (!validation.valid) {
      console.log('❌ [API ROUTE] Validation failed:', validation.errors);
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    const now = new Date().toISOString();
    const service = {
      id: `service-${uuidv4()}`,
      ...validation.data,
      createdAt: now,
      updatedAt: now
    };

    console.log('➕ [API ROUTE] Creating service with imageUrl:', service.imageUrl);
    await db.createService(service);

    console.log('✅ [API ROUTE] Service created successfully:', service.id);
    res.status(201).json(service);
  } catch (error) {
    console.error('❌ [API ROUTE] Create service error:', error);
    res.status(500).json({ error: 'Could not create service. Please try again.' });
  }
});

// PUT /api/services/:id - Update service (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const validation = validate(serviceSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Please check your input',
        details: validation.errors
      });
    }

    // Get existing service to check for old image
    const existing = await db.getServiceById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // If image is being updated, delete the old one
    if (validation.data.imageUrl && existing.imageUrl && validation.data.imageUrl !== existing.imageUrl) {
      deleteImageFile(existing.imageUrl);
    }

    const updated = await db.updateService(req.params.id, validation.data);

    if (!updated) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Could not update service. Please try again.' });
  }
});

// DELETE /api/services/:id - Delete service (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await db.deleteService(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Could not delete service. Please try again.' });
  }
});

module.exports = router;
