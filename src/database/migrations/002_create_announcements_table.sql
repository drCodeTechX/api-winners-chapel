-- Migration: Create announcements table
-- Description: Stores church announcements shown on the website

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'Bell',
  badge VARCHAR(100) NOT NULL,
  badge_variant VARCHAR(20) NOT NULL DEFAULT 'default' CHECK (badge_variant IN ('default', 'secondary', 'outline')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
