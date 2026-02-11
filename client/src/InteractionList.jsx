import React, { useState, useEffect } from 'react';
import { api } from './api';
import './InteractionList.css';

const INTERACTION_TYPES = [
  { value: 'note', label: 'Note', icon: '📝' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'message', label: 'Message', icon: '💬' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'gift', label: 'Gift', icon: '🎁' },
  { value: 'event', label: 'Event', icon: '📅' },
];

const TYPE_ICONS = Object.fromEntries(INTERACTION_TYPES.map((t) => [t.value, t.icon]));

export default function InteractionList({ contactId, interactions: initialInteractions }) {
  const [interactions, setInteractions] = useState(initialInteractions || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'note', title: '', notes: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    setInteractions(initialInteractions || []);
  }, [initialInteractions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const created = await api.interactions.create({
        contact_id: contactId,
        ...form,
        title: form.title.trim(),
        notes: form.notes.trim() || null,
      });
      setInteractions((prev) => [created, ...prev]);
      setForm({ type: 'note', title: '', notes: '', date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.interactions.delete(id);
      setInteractions((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="interaction-section">
      <div className="interaction-header">
        <h3>Interactions</h3>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Log Interaction'}
        </button>
      </div>

      {showForm && (
        <form className="interaction-form" onSubmit={handleSubmit}>
          <div className="interaction-form-row">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <input
            type="text"
            placeholder="What happened?"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            placeholder="Additional notes (optional)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <button type="submit" className="btn btn-primary btn-sm">Save</button>
        </form>
      )}

      {interactions.length === 0 ? (
        <p className="no-interactions">No interactions logged yet.</p>
      ) : (
        <div className="interaction-timeline">
          {interactions.map((interaction) => (
            <div key={interaction.id} className="interaction-item">
              <div className="interaction-icon">
                {TYPE_ICONS[interaction.type] || '📝'}
              </div>
              <div className="interaction-content">
                <div className="interaction-title">{interaction.title}</div>
                {interaction.notes && (
                  <div className="interaction-notes">{interaction.notes}</div>
                )}
                <div className="interaction-date">{interaction.date}</div>
              </div>
              <button
                className="interaction-delete"
                onClick={() => handleDelete(interaction.id)}
                title="Delete"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
