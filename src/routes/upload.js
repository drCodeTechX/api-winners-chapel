const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Temporary storage for category during upload
let uploadCategory = 'posters';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the category stored from the request or default to 'posters'
    const category = uploadCategory || 'posters';

    console.log('📁 [UPLOAD] Multer destination - Using category:', category);

    // Map category to directory name
    const categoryMap = {
      'posters': 'posters',
      'services': 'services',
      'events': 'events',
      'theme': 'theme',
      'announcements': 'announcements'
    };
    const dirName = categoryMap[category] || category;
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

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to extract category from FormData before multer processes
router.post('/', authMiddleware, (req, res, next) => {
  console.log('📥 [UPLOAD API] Received upload request');

  // Parse FormData to extract category field
  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });

  bb.on('field', (name, val) => {
    if (name === 'category') {
      console.log('📥 [UPLOAD API] Category field detected:', val);
      uploadCategory = val || 'posters';
    }
  });

  bb.on('finish', () => {
    console.log('📥 [UPLOAD API] FormData parsing complete, category set to:', uploadCategory);
    // Continue with multer upload
    upload.single('file')(req, res, (err) => {
      if (err) {
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
      }

      if (!req.file) {
        console.error('❌ [UPLOAD API] Rejection reason: No file in request');
        return res.status(400).json({ error: 'No file was uploaded' });
      }

      const category = req.body.category || uploadCategory || 'posters';
      console.log('📥 [UPLOAD API] Final category after upload:', category);
      console.log('📥 [UPLOAD API] req.body:', req.body);

      // Map category to directory name
      const categoryMap = {
        'posters': 'posters',
        'services': 'services',
        'events': 'events',
        'theme': 'theme',
        'announcements': 'announcements'
      };
      const dirName = categoryMap[category] || category;
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
  });

  req.pipe(bb);
});

module.exports = router;




