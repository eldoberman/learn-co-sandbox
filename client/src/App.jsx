import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import ContactList from './ContactList';
import ContactDetail from './ContactDetail';
import ContactForm from './ContactForm';
import './App.css';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'friend', label: 'Friends' },
  { value: 'family', label: 'Family' },
  { value: 'coworker', label: 'Co-workers' },
  { value: 'acquaintance', label: 'Acquaintances' },
  { value: 'pet', label: 'Pets' },
  { value: 'other', label: 'Other' },
];

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (favoriteFilter) params.favorite = 'true';
      const data = await api.contacts.list(params);
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, favoriteFilter]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleCreate = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleSave = async (data) => {
    try {
      if (editingContact) {
        await api.contacts.update(editingContact.id, data);
      } else {
        const created = await api.contacts.create(data);
        setSelectedId(created.id);
      }
      setShowForm(false);
      setEditingContact(null);
      await loadContacts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.contacts.delete(id);
      if (selectedId === id) setSelectedId(null);
      await loadContacts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await api.contacts.toggleFavorite(id);
      await loadContacts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Personal CRM</h1>
        <p>Keep track of the people in your life</p>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <button className="btn btn-primary btn-block" onClick={handleCreate}>
            + Add Contact
          </button>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <label className="favorite-filter">
              <input
                type="checkbox"
                checked={favoriteFilter}
                onChange={(e) => setFavoriteFilter(e.target.checked)}
              />
              Favorites only
            </label>
          </div>

          <ContactList
            contacts={contacts}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleFavorite={handleToggleFavorite}
            loading={loading}
          />
        </aside>

        <main className="main-content">
          {showForm ? (
            <ContactForm
              contact={editingContact}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingContact(null); }}
            />
          ) : selectedId ? (
            <ContactDetail
              contactId={selectedId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">&#128203;</div>
              <h2>Select a contact</h2>
              <p>Choose someone from the list or add a new contact to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
