const express = require('express');
const cors = require('cors');
const path = require('path');

const contactsRouter = require('./routes/contacts');
const interactionsRouter = require('./routes/interactions');
const tagsRouter = require('./routes/tags');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/contacts', contactsRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/tags', tagsRouter);

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
