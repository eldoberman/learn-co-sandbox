const express = require('express');
const cors = require('cors');
const path = require('path');
const initDb = require('./db');

async function start() {
  const db = await initDb();

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors());
  app.use(express.json());

  // Make db available to routes via req.db
  app.use((req, res, next) => {
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
