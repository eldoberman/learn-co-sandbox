const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// List interactions for a contact
router.get('/contact/:contactId', async (req, res) => {
  try {
    const crm = req.crm;
    if (crm) {
      const interactions = await crm.listInteractions(req.params.contactId);
      return res.json(interactions);
    }

    const db = req.db;
    const interactions = db.prepare(`
      SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC
    `).all(req.params.contactId);

    res.json(interactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create interaction
router.post('/', async (req, res) => {
  try {
    const { contact_id, title } = req.body;
    if (!contact_id || !title) {
      return res.status(400).json({ error: 'contact_id and title are required' });
    }

    const crm = req.crm;
    if (crm) {
      const interaction = await crm.createInteraction(req.body);
      if (!interaction) return res.status(404).json({ error: 'Contact not found' });
      return res.status(201).json(interaction);
    }

    const db = req.db;
    const contact = db.prepare('SELECT id FROM contacts WHERE id = ?').get(contact_id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const id = uuidv4();
    const { type, notes, date } = req.body;
    db.prepare(`
      INSERT INTO interactions (id, contact_id, type, title, notes, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, contact_id, type || 'note', title, notes || null, date || new Date().toISOString().split('T')[0]);

    const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(id);
    res.status(201).json(interaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update interaction
router.put('/:id', async (req, res) => {
  try {
    const crm = req.crm;
    if (crm) {
      const interaction = await crm.updateInteraction(req.params.id, req.body);
      if (!interaction) return res.status(404).json({ error: 'Interaction not found' });
      return res.json(interaction);
    }

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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete interaction
router.delete('/:id', async (req, res) => {
  try {
    const crm = req.crm;
    if (crm) {
      const deleted = await crm.deleteInteraction(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Interaction not found' });
      return res.status(204).end();
    }

    const db = req.db;
    const result = db.prepare('DELETE FROM interactions WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Interaction not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
