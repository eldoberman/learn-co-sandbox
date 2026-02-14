const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// List interactions for a contact
router.get('/contact/:contactId', (req, res) => {
  const db = req.db;
  const interactions = db.prepare(`
    SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC
  `).all(req.params.contactId);

  res.json(interactions);
});

// Create interaction
router.post('/', (req, res) => {
  const db = req.db;
  const { contact_id, type, title, notes, date } = req.body;

  if (!contact_id || !title) {
    return res.status(400).json({ error: 'contact_id and title are required' });
  }

  const contact = db.prepare('SELECT id FROM contacts WHERE id = ?').get(contact_id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO interactions (id, contact_id, type, title, notes, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, contact_id, type || 'note', title, notes || null, date || new Date().toISOString().split('T')[0]);

  const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(id);
  res.status(201).json(interaction);
});

// Update interaction
router.put('/:id', (req, res) => {
  const db = req.db;
  const existing = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Interaction not found' });

  const { type, title, notes, date } = req.body;

  db.prepare(`
    UPDATE interactions SET type = ?, title = ?, notes = ?, date = ? WHERE id = ?
  `).run(
    type ?? existing.type,
    title ?? existing.title,
    notes ?? existing.notes,
    date ?? existing.date,
    req.params.id,
  );

  const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
  res.json(interaction);
});

// Delete interaction
router.delete('/:id', (req, res) => {
  const db = req.db;
  const result = db.prepare('DELETE FROM interactions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Interaction not found' });
  res.status(204).end();
});

module.exports = router;
