const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// Generate JWT token
function generateToken(email) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { email: decoded.email };
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

// Verify credentials against env variables
function verifyCredentials(email, password) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@winnerschapel';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  verifyCredentials
};


