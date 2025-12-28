-- Add interaction columns to posts
ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN shares INTEGER DEFAULT 0;

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
