const express = require('express');
const { validate, loginSchema } = require('../lib/validation');
const { generateToken, verifyCredentials, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const validation = validate(loginSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validation.errors
      });
    }

    const { email, password } = validation.data;
    const isValid = verifyCredentials(email, password);

    if (!isValid) {
      return res.status(401).json({
        error: 'The email or password you entered is incorrect'
      });
    }

    const token = generateToken(email);

    res.json({
      success: true,
      email,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint exists for logging purposes or future token blacklisting
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user info
router.get('/me', authMiddleware, (req, res) => {
  res.json({ email: req.user.email });
});

module.exports = router;


