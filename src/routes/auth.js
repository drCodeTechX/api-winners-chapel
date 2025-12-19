const express = require('express');
const { validate, loginSchema } = require('../lib/validation');
const { generateToken, verifyCredentials, authMiddleware, hashPassword, comparePassword } = require('../middleware/auth');
const db = require('../lib/db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validation = validate(loginSchema, req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validation.errors
      });
    }

    const { email, password } = validation.data;
    const user = await verifyCredentials(email, password);

    if (!user) {
      return res.status(401).json({
        error: 'The email or password you entered is incorrect'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      },
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
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Could not load user info' });
  }
});

// PUT /api/auth/profile - Update current user's profile (email, name)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await db.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'This email is already in use' });
      }
    }

    const updated = await db.updateUser(req.user.id, { email, name });
    
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new token with updated email
    const token = generateToken(updated);

    res.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role
      },
      token
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// PUT /api/auth/password - Change current user's password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password hash
    const user = await db.getUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const passwordHash = await hashPassword(newPassword);
    await db.updateUserPassword(user.id, passwordHash);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Could not change password' });
  }
});

module.exports = router;
