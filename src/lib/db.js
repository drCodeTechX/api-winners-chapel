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
  const [rows] = await pool.query(
    'SELECT * FROM posters WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
  );
  return toCamelCaseArray(rows);
}

async function getPosterById(id) {
  const [rows] = await pool.query('SELECT * FROM posters WHERE id = ?', [id]);
  return toCamelCase(rows[0]);
}

async function getPostersByCategory(category) {
  const [rows] = await pool.query(
    'SELECT * FROM posters WHERE category = ? AND is_active = TRUE ORDER BY display_order ASC, created_at DESC',
    [category]
  );
  return toCamelCaseArray(rows);
}

async function getLatestThemePoster() {
  const [rows] = await pool.query(
    `SELECT * FROM posters 
     WHERE category = 'theme' AND is_active = TRUE 
     ORDER BY created_at DESC 
     LIMIT 1`
  );
  return toCamelCase(rows[0]);
}

async function createPoster(poster) {
  const { id, title, category, imageUrl, description } = poster;
  
  await pool.query(
    `INSERT INTO posters (id, title, category, image_url, description, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
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
     SET title = COALESCE(?, title),
         category = COALESCE(?, category),
         image_url = COALESCE(?, image_url),
         description = COALESCE(?, description),
         is_active = COALESCE(?, is_active),
         display_order = COALESCE(?, display_order),
         updated_at = NOW()
     WHERE id = ?`,
    [title, category, imageUrl, description, isActive, displayOrder, id]
  );
  
  return getPosterById(id);
}

async function deletePoster(id) {
  const existing = await getPosterById(id);
  if (!existing) return false;
  
  await pool.query('DELETE FROM posters WHERE id = ?', [id]);
  return true;
}

// ==================== ANNOUNCEMENTS ====================

async function getAnnouncements() {
  const [rows] = await pool.query(
    'SELECT * FROM announcements WHERE is_active = TRUE ORDER BY date DESC'
  );
  return toCamelCaseArray(rows);
}

async function getAnnouncementById(id) {
  const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
  return toCamelCase(rows[0]);
}

async function createAnnouncement(announcement) {
  const { id, title, date, description, icon, badge, badgeVariant } = announcement;
  
  await pool.query(
    `INSERT INTO announcements (id, title, date, description, icon, badge, badge_variant, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
     SET title = COALESCE(?, title),
         date = COALESCE(?, date),
         description = COALESCE(?, description),
         icon = COALESCE(?, icon),
         badge = COALESCE(?, badge),
         badge_variant = COALESCE(?, badge_variant),
         is_active = COALESCE(?, is_active),
         updated_at = NOW()
     WHERE id = ?`,
    [title, date, description, icon, badge, badgeVariant, isActive, id]
  );
  
  return getAnnouncementById(id);
}

async function deleteAnnouncement(id) {
  const existing = await getAnnouncementById(id);
  if (!existing) return false;
  
  await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
  return true;
}

// ==================== EVENTS ====================

async function getEvents() {
  const [rows] = await pool.query(
    'SELECT * FROM events WHERE is_active = TRUE ORDER BY date ASC'
  );
  return toCamelCaseArray(rows);
}

async function getEventById(id) {
  const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
  return toCamelCase(rows[0]);
}

async function getUpcomingEvents(limit = 4) {
  const [rows] = await pool.query(
    `SELECT * FROM events 
     WHERE is_active = TRUE AND date >= CURDATE() 
     ORDER BY date ASC 
     LIMIT ?`,
    [limit]
  );
  return toCamelCaseArray(rows);
}

async function createEvent(event) {
  const { id, title, date, time, description, imageUrl } = event;
  
  await pool.query(
    `INSERT INTO events (id, title, date, time, description, image_url, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
     SET title = COALESCE(?, title),
         date = COALESCE(?, date),
         time = COALESCE(?, time),
         description = COALESCE(?, description),
         image_url = COALESCE(?, image_url),
         is_active = COALESCE(?, is_active),
         updated_at = NOW()
     WHERE id = ?`,
    [title, date, time, description, imageUrl, isActive, id]
  );
  
  return getEventById(id);
}

async function deleteEvent(id) {
  const existing = await getEventById(id);
  if (!existing) return false;
  
  await pool.query('DELETE FROM events WHERE id = ?', [id]);
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
  deleteEvent
};
