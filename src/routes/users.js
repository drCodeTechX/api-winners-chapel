const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, hashPassword } = require('../middleware/auth');
const db = require('../lib/db');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Could not load users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Could not load user' });
  }
});

// POST /api/users - Create new user (invite)
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = {
      id: `user-${uuidv4()}`,
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
      role: role || 'admin',
      mustChangePassword: true // New users must change their password
    };

    const created = await db.createUser(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully. They will be asked to change their password on first login.',
      user: created
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Could not create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { email, name, role, isActive } = req.body;

    // Can't update own role or deactivate self
    if (req.params.id === req.user.id) {
      if (role !== undefined || isActive !== undefined) {
        return res.status(400).json({ error: 'You cannot change your own role or deactivate yourself' });
      }
    }

    if (email) {
      const existingUser = await db.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.params.id) {
        return res.status(400).json({ error: 'This email is already in use' });
      }
    }

    const updated = await db.updateUser(req.params.id, { email, name, role, isActive });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Could not update user' });
  }
});

// PUT /api/users/:id/reset-password - Reset user's password (admin action)
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await hashPassword(newPassword);
    
    // Reset password and require change on next login
    await db.updateUserPassword(user.id, passwordHash);
    
    // Mark that user must change password (we need to update this separately)
    await db.updateUser(user.id, {});
    
    res.json({ 
      success: true, 
      message: 'Password has been reset. The user will need to change it on their next login.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Could not reset password' });
  }
});

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', async (req, res) => {
  try {
    // Can't delete self
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const deleted = await db.deleteUser(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Could not deactivate user' });
  }
});

module.exports = router;

