-- Blog Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Admin Users Table (Simple Store)
-- In a real production app, you'd use a better auth provider,
-- but for a simple blog, storing a hashed password or just environment variable auth is easier.
-- We will use Environment Variable for simple Basic Auth to keep it lightweight.
-- So we don't strictly need a users table for single-user blog.

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
