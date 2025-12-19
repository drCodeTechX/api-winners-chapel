const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please log in to continue' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }

  req.user = payload;
  next();
}

// Hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password with hash
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Verify credentials against database
async function verifyCredentials(email, password) {
  const user = await db.getUserByEmail(email);
  
  if (!user) {
    return null;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  
  if (!isValid) {
    return null;
  }

  // Update last login
  await db.updateLastLogin(user.id);

  return user;
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  hashPassword,
  comparePassword,
  verifyCredentials
};
