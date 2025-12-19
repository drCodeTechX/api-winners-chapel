const { pool } = require('../database/connection');

// Helper to convert snake_case to camelCase for response
function toCamelCase(row) {
  if (!row) return null;
  const result = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

function toCamelCaseArray(rows) {
  return rows.map(toCamelCase);
}

// ==================== POSTERS ====================

async function getPosters() {
  const result = await pool.query(
    'SELECT * FROM posters WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
  );
  return toCamelCaseArray(result.rows);
}

async function getPosterById(id) {
  const result = await pool.query('SELECT * FROM posters WHERE id = $1', [id]);
  return toCamelCase(result.rows[0]);
}

async function getPostersByCategory(category) {
  const result = await pool.query(
    'SELECT * FROM posters WHERE category = $1 AND is_active = TRUE ORDER BY display_order ASC, created_at DESC',
    [category]
  );
  return toCamelCaseArray(result.rows);
}

async function getLatestThemePoster() {
  const result = await pool.query(
    `SELECT * FROM posters 
     WHERE category = 'theme' AND is_active = TRUE 
     ORDER BY created_at DESC 
     LIMIT 1`
  );
  return toCamelCase(result.rows[0]);
}

async function createPoster(poster) {
  const { id, title, category, imageUrl, description } = poster;
  
  await pool.query(
    `INSERT INTO posters (id, title, category, image_url, description, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [id, title, category, imageUrl, description || null]
  );
  
  return getPosterById(id);
}

async function updatePoster(id, updates) {
  const existing = await getPosterById(id);
  if (!existing) return null;
  
  const { title, category, imageUrl, description, isActive, displayOrder } = updates;
  
  await pool.query(
    `UPDATE posters 
     SET title = COALESCE($1, title),
         category = COALESCE($2, category),
         image_url = COALESCE($3, image_url),
         description = COALESCE($4, description),
         is_active = COALESCE($5, is_active),
         display_order = COALESCE($6, display_order),
         updated_at = NOW()
     WHERE id = $7`,
    [title, category, imageUrl, description, isActive, displayOrder, id]
  );
  
  return getPosterById(id);
}

async function deletePoster(id) {
  const existing = await getPosterById(id);
  if (!existing) return false;
  
  await pool.query('DELETE FROM posters WHERE id = $1', [id]);
  return true;
}

// ==================== ANNOUNCEMENTS ====================

async function getAnnouncements() {
  const result = await pool.query(
    'SELECT * FROM announcements WHERE is_active = TRUE ORDER BY date DESC'
  );
  return toCamelCaseArray(result.rows);
}

async function getAnnouncementById(id) {
  const result = await pool.query('SELECT * FROM announcements WHERE id = $1', [id]);
  return toCamelCase(result.rows[0]);
}

async function createAnnouncement(announcement) {
  const { id, title, date, description, icon, badge, badgeVariant } = announcement;
  
  await pool.query(
    `INSERT INTO announcements (id, title, date, description, icon, badge, badge_variant, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [id, title, date, description, icon, badge, badgeVariant]
  );
  
  return getAnnouncementById(id);
}

async function updateAnnouncement(id, updates) {
  const existing = await getAnnouncementById(id);
  if (!existing) return null;
  
  const { title, date, description, icon, badge, badgeVariant, isActive } = updates;
  
  await pool.query(
    `UPDATE announcements 
     SET title = COALESCE($1, title),
         date = COALESCE($2, date),
         description = COALESCE($3, description),
         icon = COALESCE($4, icon),
         badge = COALESCE($5, badge),
         badge_variant = COALESCE($6, badge_variant),
         is_active = COALESCE($7, is_active),
         updated_at = NOW()
     WHERE id = $8`,
    [title, date, description, icon, badge, badgeVariant, isActive, id]
  );
  
  return getAnnouncementById(id);
}

async function deleteAnnouncement(id) {
  const existing = await getAnnouncementById(id);
  if (!existing) return false;
  
  await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
  return true;
}

// ==================== EVENTS ====================

async function getEvents() {
  const result = await pool.query(
    'SELECT * FROM events WHERE is_active = TRUE ORDER BY date ASC'
  );
  return toCamelCaseArray(result.rows);
}

async function getEventById(id) {
  const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  return toCamelCase(result.rows[0]);
}

async function getUpcomingEvents(limit = 4) {
  const result = await pool.query(
    `SELECT * FROM events 
     WHERE is_active = TRUE AND date >= CURRENT_DATE 
     ORDER BY date ASC 
     LIMIT $1`,
    [limit]
  );
  return toCamelCaseArray(result.rows);
}

async function createEvent(event) {
  const { id, title, date, time, description, imageUrl } = event;
  
  await pool.query(
    `INSERT INTO events (id, title, date, time, description, image_url, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [id, title, date, time, description, imageUrl]
  );
  
  return getEventById(id);
}

async function updateEvent(id, updates) {
  const existing = await getEventById(id);
  if (!existing) return null;
  
  const { title, date, time, description, imageUrl, isActive } = updates;
  
  await pool.query(
    `UPDATE events 
     SET title = COALESCE($1, title),
         date = COALESCE($2, date),
         time = COALESCE($3, time),
         description = COALESCE($4, description),
         image_url = COALESCE($5, image_url),
         is_active = COALESCE($6, is_active),
         updated_at = NOW()
     WHERE id = $7`,
    [title, date, time, description, imageUrl, isActive, id]
  );
  
  return getEventById(id);
}

async function deleteEvent(id) {
  const existing = await getEventById(id);
  if (!existing) return false;
  
  await pool.query('DELETE FROM events WHERE id = $1', [id]);
  return true;
}

// ==================== USERS ====================

async function getUsers() {
  const result = await pool.query(
    'SELECT id, email, name, role, must_change_password, is_active, last_login, created_at, updated_at FROM users WHERE is_active = TRUE ORDER BY created_at DESC'
  );
  return toCamelCaseArray(result.rows);
}

async function getUserById(id) {
  const result = await pool.query(
    'SELECT id, email, name, role, must_change_password, is_active, last_login, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return toCamelCase(result.rows[0]);
}

async function getUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
    [email.toLowerCase()]
  );
  return toCamelCase(result.rows[0]);
}

async function createUser(user) {
  const { id, email, passwordHash, name, role, mustChangePassword } = user;
  
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, role, must_change_password, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [id, email.toLowerCase(), passwordHash, name || null, role || 'admin', mustChangePassword !== false]
  );
  
  return getUserById(id);
}

async function updateUser(id, updates) {
  const existing = await getUserById(id);
  if (!existing) return null;
  
  const { email, name, role, isActive } = updates;
  
  await pool.query(
    `UPDATE users 
     SET email = COALESCE($1, email),
         name = COALESCE($2, name),
         role = COALESCE($3, role),
         is_active = COALESCE($4, is_active),
         updated_at = NOW()
     WHERE id = $5`,
    [email?.toLowerCase(), name, role, isActive, id]
  );
  
  return getUserById(id);
}

async function updateUserPassword(id, passwordHash) {
  await pool.query(
    `UPDATE users 
     SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, id]
  );
  return getUserById(id);
}

async function updateLastLogin(id) {
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [id]
  );
}

async function deleteUser(id) {
  const existing = await getUserById(id);
  if (!existing) return false;
  
  // Soft delete - just deactivate
  await pool.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
  return true;
}

module.exports = {
  // Posters
  getPosters,
  getPosterById,
  getPostersByCategory,
  getLatestThemePoster,
  createPoster,
  updatePoster,
  deletePoster,
  // Announcements
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  // Events
  getEvents,
  getEventById,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  // Users
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  updateUserPassword,
  updateLastLogin,
  deleteUser
};
