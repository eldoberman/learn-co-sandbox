const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'crm.db');
const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

// Save database to disk periodically and on changes
function save() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

// Wrapper to match better-sqlite3-style API
function createWrapper(database) {
  return {
    prepare(sql) {
      return {
        all(...params) {
          try {
            const stmt = database.prepare(sql);
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) {
              rows.push(stmt.getAsObject());
            }
            stmt.free();
            return rows;
          } catch (e) {
            return [];
          }
        },
        get(...params) {
          try {
            const stmt = database.prepare(sql);
            stmt.bind(params);
            let row = null;
            if (stmt.step()) {
              row = stmt.getAsObject();
            }
            stmt.free();
            return row;
          } catch (e) {
            return null;
          }
        },
        run(...params) {
          database.run(sql, params);
          save();
          const changes = database.getRowsModified();
          return { changes };
        },
      };
    },
    exec(sql) {
      database.exec(sql);
      save();
    },
  };
}

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  const wrapper = createWrapper(db);

  wrapper.exec(`
    PRAGMA foreign_keys = ON;

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

  return wrapper;
}

module.exports = initDb;
