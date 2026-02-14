const express = require('express');
const cors = require('cors');
const path = require('path');
const initDb = require('./db');
const { initSheets } = require('./sheets');

async function start() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors());
  app.use(express.json());

  // Try Google Sheets first, fall back to local SQLite
  let crm = null;
  let db = null;

  try {
    crm = await initSheets();
    if (crm) {
      console.log('Connected to Google Sheets');
    }
  } catch (err) {
    console.log('Google Sheets not configured, using local database:', err.message);
  }

  if (!crm) {
    db = await initDb();
    console.log('Using local SQLite database');
  }

  // Make data layer available to routes
  app.use((req, res, next) => {
    req.crm = crm;
    req.db = db;
    next();
  });

  // API routes
  app.use('/api/contacts', require('./routes/contacts'));
  app.use('/api/interactions', require('./routes/interactions'));
  app.use('/api/tags', require('./routes/tags'));

  // Serve static frontend in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Personal CRM server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
