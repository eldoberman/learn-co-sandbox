const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// List all contacts with optional search/filter
router.get('/', (req, res) => {
  const db = req.db;
  const { search, category, tag, favorite } = req.query;

  let query = `
    SELECT DISTINCT c.*
    FROM contacts c
    LEFT JOIN contact_tags ct ON c.id = ct.contact_id
    LEFT JOIN tags t ON ct.tag_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.company LIKE ? OR c.notes LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  if (category) {
    query += ` AND c.category = ?`;
    params.push(category);
  }

  if (tag) {
    query += ` AND t.name = ?`;
    params.push(tag);
  }

  if (favorite === 'true') {
    query += ` AND c.favorite = 1`;
  }

  query += ` ORDER BY c.favorite DESC, c.first_name ASC, c.last_name ASC`;

  const contacts = db.prepare(query).all(...params);

  const result = contacts.map(contact => ({
    ...contact,
    favorite: !!contact.favorite,
    tags: db.prepare(`
      SELECT t.id, t.name FROM tags t
      JOIN contact_tags ct ON t.id = ct.tag_id
      WHERE ct.contact_id = ?
    `).all(contact.id),
  }));

  res.json(result);
});

// Get single contact with tags and recent interactions
router.get('/:id', (req, res) => {
  const db = req.db;
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const tags = db.prepare(`
    SELECT t.id, t.name FROM tags t
    JOIN contact_tags ct ON t.id = ct.tag_id
    WHERE ct.contact_id = ?
  `).all(contact.id);

  const interactions = db.prepare(`
    SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC LIMIT 50
  `).all(contact.id);

  res.json({
    ...contact,
    favorite: !!contact.favorite,
    tags,
    interactions,
  });
});

// Create contact
router.post('/', (req, res) => {
  const db = req.db;
  const id = uuidv4();
  const {
    first_name, last_name, category, email, phone,
    birthday, address, company, job_title, photo_url, notes, favorite, tags,
  } = req.body;

  if (!first_name) return res.status(400).json({ error: 'first_name is required' });

  db.prepare(`
    INSERT INTO contacts (id, first_name, last_name, category, email, phone, birthday, address, company, job_title, photo_url, notes, favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, first_name, last_name || null, category || 'other', email || null,
    phone || null, birthday || null, address || null, company || null,
    job_title || null, photo_url || null, notes || null, favorite ? 1 : 0);

  if (tags && tags.length > 0) {
    setContactTags(db, id, tags);
  }

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
  const contactTags = db.prepare(`
    SELECT t.id, t.name FROM tags t JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = ?
  `).all(id);

  res.status(201).json({ ...contact, favorite: !!contact.favorite, tags: contactTags });
});

// Update contact
router.put('/:id', (req, res) => {
  const db = req.db;
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const {
    first_name, last_name, category, email, phone,
    birthday, address, company, job_title, photo_url, notes, favorite, tags,
  } = req.body;

  db.prepare(`
    UPDATE contacts SET
      first_name = ?, last_name = ?, category = ?, email = ?, phone = ?,
      birthday = ?, address = ?, company = ?, job_title = ?, photo_url = ?,
      notes = ?, favorite = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    first_name ?? existing.first_name,
    last_name ?? existing.last_name,
    category ?? existing.category,
    email ?? existing.email,
    phone ?? existing.phone,
    birthday ?? existing.birthday,
    address ?? existing.address,
    company ?? existing.company,
    job_title ?? existing.job_title,
    photo_url ?? existing.photo_url,
    notes ?? existing.notes,
    favorite !== undefined ? (favorite ? 1 : 0) : existing.favorite,
    req.params.id,
  );

  if (tags !== undefined) {
    setContactTags(db, req.params.id, tags);
  }

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  const contactTags = db.prepare(`
    SELECT t.id, t.name FROM tags t JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = ?
  `).all(req.params.id);

  res.json({ ...contact, favorite: !!contact.favorite, tags: contactTags });
});

// Delete contact
router.delete('/:id', (req, res) => {
  const db = req.db;
  // Manually delete related records since sql.js doesn't reliably cascade
  db.prepare('DELETE FROM contact_tags WHERE contact_id = ?').run(req.params.id);
  db.prepare('DELETE FROM interactions WHERE contact_id = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.status(204).end();
});

// Toggle favorite
router.patch('/:id/favorite', (req, res) => {
  const db = req.db;
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  db.prepare("UPDATE contacts SET favorite = ?, updated_at = datetime('now') WHERE id = ?")
    .run(contact.favorite ? 0 : 1, req.params.id);

  const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json({ ...updated, favorite: !!updated.favorite });
});

function setContactTags(db, contactId, tagNames) {
  db.prepare('DELETE FROM contact_tags WHERE contact_id = ?').run(contactId);

  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;

    let tag = db.prepare('SELECT * FROM tags WHERE name = ?').get(trimmed);
    if (!tag) {
      const tagId = uuidv4();
      db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(tagId, trimmed);
      tag = { id: tagId, name: trimmed };
    }

    db.prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)').run(contactId, tag.id);
  }
}

module.exports = router;
