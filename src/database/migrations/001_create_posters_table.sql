-- Migration: Create posters table
-- Description: Stores church posters for services, events, and monthly themes

CREATE TABLE IF NOT EXISTS posters (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('service', 'event', 'theme')),
  image_url VARCHAR(500) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posters_category ON posters(category);
CREATE INDEX IF NOT EXISTS idx_posters_is_active ON posters(is_active);
CREATE INDEX IF NOT EXISTS idx_posters_created_at ON posters(created_at DESC);
