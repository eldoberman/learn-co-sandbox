const express = require('express');
const db = require('../db');

const router = express.Router();

// List all tags with contact counts
router.get('/', (req, res) => {
  const tags = db.prepare(`
    SELECT t.id, t.name, COUNT(ct.contact_id) as contact_count
    FROM tags t
    LEFT JOIN contact_tags ct ON t.id = ct.tag_id
    GROUP BY t.id
    ORDER BY t.name ASC
  `).all();

  res.json(tags);
});

module.exports = router;
