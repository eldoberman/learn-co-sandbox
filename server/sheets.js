const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');

// Sheet tab names
const TABS = {
  CONTACTS: 'Contacts',
  TAGS: 'Tags',
  CONTACT_TAGS: 'ContactTags',
  INTERACTIONS: 'Interactions',
};

// Column headers for each tab
const HEADERS = {
  [TABS.CONTACTS]: [
    'id', 'first_name', 'last_name', 'category', 'email', 'phone',
    'birthday', 'address', 'company', 'job_title', 'photo_url',
    'notes', 'favorite', 'created_at', 'updated_at',
  ],
  [TABS.TAGS]: ['id', 'name'],
  [TABS.CONTACT_TAGS]: ['contact_id', 'tag_id'],
  [TABS.INTERACTIONS]: ['id', 'contact_id', 'type', 'title', 'notes', 'date', 'created_at'],
};

class SheetsDB {
  constructor(sheets, spreadsheetId) {
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;
  }

  // Read all rows from a tab, returning array of objects
  async getAll(tab) {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:Z`,
    });
    const rows = res.data.values || [];
    if (rows.length <= 1) return []; // only headers or empty

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i] : null;
      });
      return obj;
    });
  }

  // Find a row's index (1-based, accounting for header) by column value
  async findRowIndex(tab, column, value) {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:Z`,
    });
    const rows = res.data.values || [];
    if (rows.length <= 1) return -1;

    const headers = rows[0];
    const colIdx = headers.indexOf(column);
    if (colIdx === -1) return -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][colIdx] === value) return i + 1; // 1-based for Sheets API
    }
    return -1;
  }

  // Append a row to a tab
  async append(tab, data) {
    const headers = HEADERS[tab];
    const row = headers.map((h) => data[h] !== undefined && data[h] !== null ? String(data[h]) : '');

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:Z`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
  }

  // Update a row by its sheet row number (1-based)
  async updateRow(tab, rowNumber, data) {
    const headers = HEADERS[tab];
    const row = headers.map((h) => data[h] !== undefined && data[h] !== null ? String(data[h]) : '');

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A${rowNumber}:${String.fromCharCode(65 + headers.length - 1)}${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  }

  // Delete a row by its sheet row number (1-based)
  async deleteRow(tab, rowNumber) {
    // Get sheet ID for the tab
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });
    const sheet = spreadsheet.data.sheets.find((s) => s.properties.title === tab);
    if (!sheet) return;

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        }],
      },
    });
  }

  // Delete all rows matching a condition
  async deleteWhere(tab, column, value) {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:Z`,
    });
    const rows = res.data.values || [];
    if (rows.length <= 1) return 0;

    const headers = rows[0];
    const colIdx = headers.indexOf(column);
    if (colIdx === -1) return 0;

    // Find matching row indices (reverse order to delete from bottom up)
    const toDelete = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][colIdx] === value) {
        toDelete.push(i + 1);
      }
    }

    // Delete from bottom up so indices don't shift
    for (const rowNum of toDelete.reverse()) {
      await this.deleteRow(tab, rowNum);
    }

    return toDelete.length;
  }
}

// High-level CRM operations that the routes will call
class CRMSheets {
  constructor(sheetsDb) {
    this.db = sheetsDb;
  }

  // --- CONTACTS ---

  async listContacts({ search, category, tag, favorite } = {}) {
    let contacts = await this.db.getAll(TABS.CONTACTS);

    if (search) {
      const term = search.toLowerCase();
      contacts = contacts.filter((c) =>
        (c.first_name || '').toLowerCase().includes(term) ||
        (c.last_name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.company || '').toLowerCase().includes(term) ||
        (c.notes || '').toLowerCase().includes(term)
      );
    }

    if (category) {
      contacts = contacts.filter((c) => c.category === category);
    }

    if (favorite === 'true') {
      contacts = contacts.filter((c) => c.favorite === '1');
    }

    // Attach tags
    const allContactTags = await this.db.getAll(TABS.CONTACT_TAGS);
    const allTags = await this.db.getAll(TABS.TAGS);

    if (tag) {
      const tagObj = allTags.find((t) => t.name === tag);
      if (tagObj) {
        const taggedIds = new Set(allContactTags.filter((ct) => ct.tag_id === tagObj.id).map((ct) => ct.contact_id));
        contacts = contacts.filter((c) => taggedIds.has(c.id));
      } else {
        contacts = [];
      }
    }

    const result = contacts.map((c) => {
      const tagIds = allContactTags.filter((ct) => ct.contact_id === c.id).map((ct) => ct.tag_id);
      const tags = allTags.filter((t) => tagIds.includes(t.id));
      return { ...c, favorite: c.favorite === '1', tags };
    });

    // Sort: favorites first, then alphabetical
    result.sort((a, b) => {
      if (a.favorite !== b.favorite) return b.favorite ? 1 : -1;
      return (a.first_name || '').localeCompare(b.first_name || '');
    });

    return result;
  }

  async getContact(id) {
    const contacts = await this.db.getAll(TABS.CONTACTS);
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return null;

    const allContactTags = await this.db.getAll(TABS.CONTACT_TAGS);
    const allTags = await this.db.getAll(TABS.TAGS);
    const tagIds = allContactTags.filter((ct) => ct.contact_id === id).map((ct) => ct.tag_id);
    const tags = allTags.filter((t) => tagIds.includes(t.id));

    const allInteractions = await this.db.getAll(TABS.INTERACTIONS);
    const interactions = allInteractions
      .filter((i) => i.contact_id === id)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 50);

    return { ...contact, favorite: contact.favorite === '1', tags, interactions };
  }

  async createContact(data) {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const contact = {
      id,
      first_name: data.first_name,
      last_name: data.last_name || '',
      category: data.category || 'other',
      email: data.email || '',
      phone: data.phone || '',
      birthday: data.birthday || '',
      address: data.address || '',
      company: data.company || '',
      job_title: data.job_title || '',
      photo_url: data.photo_url || '',
      notes: data.notes || '',
      favorite: data.favorite ? '1' : '0',
      created_at: now,
      updated_at: now,
    };

    await this.db.append(TABS.CONTACTS, contact);

    let tags = [];
    if (data.tags && data.tags.length > 0) {
      tags = await this.setContactTags(id, data.tags);
    }

    return { ...contact, favorite: contact.favorite === '1', tags };
  }

  async updateContact(id, data) {
    const rowIndex = await this.db.findRowIndex(TABS.CONTACTS, 'id', id);
    if (rowIndex === -1) return null;

    const contacts = await this.db.getAll(TABS.CONTACTS);
    const existing = contacts.find((c) => c.id === id);
    if (!existing) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updated = {
      id,
      first_name: data.first_name ?? existing.first_name,
      last_name: data.last_name ?? existing.last_name,
      category: data.category ?? existing.category,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      birthday: data.birthday ?? existing.birthday,
      address: data.address ?? existing.address,
      company: data.company ?? existing.company,
      job_title: data.job_title ?? existing.job_title,
      photo_url: data.photo_url ?? existing.photo_url,
      notes: data.notes ?? existing.notes,
      favorite: data.favorite !== undefined ? (data.favorite ? '1' : '0') : existing.favorite,
      created_at: existing.created_at,
      updated_at: now,
    };

    await this.db.updateRow(TABS.CONTACTS, rowIndex, updated);

    let tags;
    if (data.tags !== undefined) {
      tags = await this.setContactTags(id, data.tags);
    } else {
      const allContactTags = await this.db.getAll(TABS.CONTACT_TAGS);
      const allTags = await this.db.getAll(TABS.TAGS);
      const tagIds = allContactTags.filter((ct) => ct.contact_id === id).map((ct) => ct.tag_id);
      tags = allTags.filter((t) => tagIds.includes(t.id));
    }

    return { ...updated, favorite: updated.favorite === '1', tags };
  }

  async deleteContact(id) {
    const rowIndex = await this.db.findRowIndex(TABS.CONTACTS, 'id', id);
    if (rowIndex === -1) return false;

    // Delete related data first
    await this.db.deleteWhere(TABS.CONTACT_TAGS, 'contact_id', id);
    await this.db.deleteWhere(TABS.INTERACTIONS, 'contact_id', id);
    // Re-find row index since deletions in other tabs don't affect this tab
    const newRowIndex = await this.db.findRowIndex(TABS.CONTACTS, 'id', id);
    if (newRowIndex !== -1) {
      await this.db.deleteRow(TABS.CONTACTS, newRowIndex);
    }

    return true;
  }

  async toggleFavorite(id) {
    const rowIndex = await this.db.findRowIndex(TABS.CONTACTS, 'id', id);
    if (rowIndex === -1) return null;

    const contacts = await this.db.getAll(TABS.CONTACTS);
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...contact,
      favorite: contact.favorite === '1' ? '0' : '1',
      updated_at: now,
    };

    await this.db.updateRow(TABS.CONTACTS, rowIndex, updated);
    return { ...updated, favorite: updated.favorite === '1' };
  }

  async setContactTags(contactId, tagNames) {
    // Remove existing tags for this contact
    await this.db.deleteWhere(TABS.CONTACT_TAGS, 'contact_id', contactId);

    const allTags = await this.db.getAll(TABS.TAGS);
    const resultTags = [];

    for (const name of tagNames) {
      const trimmed = name.trim().toLowerCase();
      if (!trimmed) continue;

      let tag = allTags.find((t) => t.name === trimmed);
      if (!tag) {
        tag = { id: uuidv4(), name: trimmed };
        await this.db.append(TABS.TAGS, tag);
        allTags.push(tag);
      }

      await this.db.append(TABS.CONTACT_TAGS, { contact_id: contactId, tag_id: tag.id });
      resultTags.push(tag);
    }

    return resultTags;
  }

  // --- INTERACTIONS ---

  async listInteractions(contactId) {
    const all = await this.db.getAll(TABS.INTERACTIONS);
    return all
      .filter((i) => i.contact_id === contactId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  async createInteraction(data) {
    // Verify contact exists
    const contacts = await this.db.getAll(TABS.CONTACTS);
    if (!contacts.find((c) => c.id === data.contact_id)) return null;

    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const interaction = {
      id,
      contact_id: data.contact_id,
      type: data.type || 'note',
      title: data.title,
      notes: data.notes || '',
      date: data.date || new Date().toISOString().split('T')[0],
      created_at: now,
    };

    await this.db.append(TABS.INTERACTIONS, interaction);
    return interaction;
  }

  async updateInteraction(id, data) {
    const rowIndex = await this.db.findRowIndex(TABS.INTERACTIONS, 'id', id);
    if (rowIndex === -1) return null;

    const all = await this.db.getAll(TABS.INTERACTIONS);
    const existing = all.find((i) => i.id === id);
    if (!existing) return null;

    const updated = {
      ...existing,
      type: data.type ?? existing.type,
      title: data.title ?? existing.title,
      notes: data.notes ?? existing.notes,
      date: data.date ?? existing.date,
    };

    await this.db.updateRow(TABS.INTERACTIONS, rowIndex, updated);
    return updated;
  }

  async deleteInteraction(id) {
    const rowIndex = await this.db.findRowIndex(TABS.INTERACTIONS, 'id', id);
    if (rowIndex === -1) return false;
    await this.db.deleteRow(TABS.INTERACTIONS, rowIndex);
    return true;
  }

  // --- TAGS ---

  async listTags() {
    const allTags = await this.db.getAll(TABS.TAGS);
    const allContactTags = await this.db.getAll(TABS.CONTACT_TAGS);

    return allTags.map((t) => ({
      ...t,
      contact_count: allContactTags.filter((ct) => ct.tag_id === t.id).length,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
}

async function initSheets() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    return null;
  }

  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId) {
    return null;
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Ensure all tabs exist with headers
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTabs = spreadsheet.data.sheets.map((s) => s.properties.title);

  for (const [tab, headers] of Object.entries(HEADERS)) {
    if (!existingTabs.includes(tab)) {
      // Add new tab
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tab } } }],
        },
      });
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }
  }

  const sheetsDb = new SheetsDB(sheets, spreadsheetId);
  return new CRMSheets(sheetsDb);
}

module.exports = { initSheets, CRMSheets, TABS, HEADERS };
