const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'crm.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    email TEXT,
    phone TEXT,
    birthday TEXT,
    address TEXT,
    company TEXT,
    job_title TEXT,
    photo_url TEXT,
    notes TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (contact_id, tag_id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note',
    title TEXT NOT NULL,
    notes TEXT,
    date TEXT NOT NULL DEFAULT (date('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
  CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(favorite);
  CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
  CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date);
`);

module.exports = db;
