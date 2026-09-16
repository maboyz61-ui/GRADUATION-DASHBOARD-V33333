-- Canonical DDL. Types are limited to TEXT / INTEGER / REAL so the same file
-- applies to both SQLite (dev/test) and PostgreSQL (production).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  student_number TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  campus TEXT,
  faculty TEXT,
  degree TEXT,
  identifier TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  status TEXT NOT NULL DEFAULT 'active',
  department TEXT,
  avatar_hue INTEGER,
  pin_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  channel TEXT,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  campus TEXT,
  event_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  photos INTEGER NOT NULL DEFAULT 0,
  photographers INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  identifier TEXT,
  title TEXT NOT NULL,
  event_id TEXT,
  event_name TEXT,
  campus TEXT,
  captured_at TEXT,
  resolution TEXT,
  file_size TEXT,
  s3_key TEXT,
  storage_key TEXT,
  price REAL NOT NULL DEFAULT 0,
  tagged INTEGER NOT NULL DEFAULT 0,
  moderated INTEGER NOT NULL DEFAULT 0,
  favourite INTEGER NOT NULL DEFAULT 0,
  photo_type TEXT,
  location TEXT,
  url TEXT,
  thumb_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS textures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  family TEXT,
  hex TEXT,
  price REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hex TEXT,
  price REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS overlays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS frame_sizes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  width REAL,
  height REAL,
  price REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  identifier TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total REAL NOT NULL DEFAULT 0,
  payment_ref TEXT,
  gateway TEXT DEFAULT 'PayFast',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  photo_id TEXT,
  title TEXT,
  kind TEXT,
  texture TEXT,
  mat TEXT,
  overlay TEXT,
  size TEXT,
  qty INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  payment_ref TEXT,
  status TEXT,
  amount REAL,
  raw TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_student ON photos (student_id);
CREATE INDEX IF NOT EXISTS idx_photos_identifier ON photos (identifier);
CREATE INDEX IF NOT EXISTS idx_orders_student ON orders (student_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_user ON access_codes (user_id);
