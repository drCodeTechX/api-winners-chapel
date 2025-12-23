const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer storage with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get category from request body (multer parses fields before files)
    const category = req.body.category;

    console.log('📁 [UPLOAD] Multer destination - Using category:', category);

    // Map category to directory name - only allow categories that support images
    const categoryMap = {
      'services': 'services',
      'events': 'events',
      'theme': 'theme'
    };

    if (!category || !categoryMap[category]) {
      console.error('❌ [UPLOAD] Invalid category:', category);
      return cb(new Error('Invalid category. Must be one of: services, events, theme'));
    }

    const dirName = categoryMap[category];
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', dirName);

    console.log('📁 [UPLOAD] Multer destination - Directory name:', dirName);
    console.log('📁 [UPLOAD] Multer destination - Full path:', uploadDir);

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      console.log('📁 [UPLOAD] Multer destination - Creating directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    } else {
      console.log('📁 [UPLOAD] Multer destination - Directory already exists');
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    console.log('📁 [UPLOAD] Multer filename - Generated:', filename);
    cb(null, filename);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'), false);
  }
};

// Configure multer - it will automatically parse fields before files
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload endpoint - multer handles both fields and file
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  console.log('📥 [UPLOAD API] Received upload request');

  if (!req.file) {
    console.error('❌ [UPLOAD API] Rejection reason: No file in request');
    return res.status(400).json({ error: 'No file was uploaded' });
  }

  const category = req.body.category;
  console.log('📥 [UPLOAD API] Final category after upload:', category);
  console.log('📥 [UPLOAD API] req.body:', req.body);

  // Map category to directory name - must match the validation in multer destination
  const categoryMap = {
    'services': 'services',
    'events': 'events',
    'theme': 'theme'
  };

  // This should never happen as multer would have rejected it, but double-check
  if (!categoryMap[category]) {
    console.error('❌ [UPLOAD API] Invalid category in response:', category);
    return res.status(400).json({ error: 'Invalid upload category' });
  }

  const dirName = categoryMap[category];
  const url = `/uploads/${dirName}/${req.file.filename}`;

  console.log('✅ [UPLOAD API] Upload successful!', {
    filename: req.file.filename,
    size: `${(req.file.size / 1024).toFixed(2)} KB`,
    mimetype: req.file.mimetype,
    category: category,
    dirName: dirName,
    url: url,
    actualPath: req.file.path
  });

  res.json({
    success: true,
    url,
    filename: req.file.filename
  });
});

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  console.error('❌ [UPLOAD API] Upload error:', err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      console.error('❌ [UPLOAD API] Rejection reason: File too large');
      return res.status(400).json({ error: 'File is too large. Maximum size is 5MB.' });
    }
    console.error('❌ [UPLOAD API] Rejection reason: Multer error -', err.code);
    return res.status(400).json({ error: 'Upload failed. Please try again.' });
  }

  console.error('❌ [UPLOAD API] Rejection reason:', err.message);
  return res.status(400).json({ error: err.message || 'Upload failed. Please try again.' });
});

module.exports = router;




