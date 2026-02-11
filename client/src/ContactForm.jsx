import React, { useState } from 'react';
import './ContactForm.css';

const CATEGORIES = [
  { value: 'friend', label: 'Friend' },
  { value: 'family', label: 'Family' },
  { value: 'coworker', label: 'Co-worker' },
  { value: 'acquaintance', label: 'Acquaintance' },
  { value: 'pet', label: 'Pet' },
  { value: 'other', label: 'Other' },
];

export default function ContactForm({ contact, onSave, onCancel }) {
  const [form, setForm] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    category: contact?.category || 'friend',
    email: contact?.email || '',
    phone: contact?.phone || '',
    birthday: contact?.birthday || '',
    address: contact?.address || '',
    company: contact?.company || '',
    job_title: contact?.job_title || '',
    photo_url: contact?.photo_url || '',
    notes: contact?.notes || '',
    favorite: contact?.favorite || false,
    tags: contact?.tags?.map((t) => t.name).join(', ') || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) {
      alert('First name is required');
      return;
    }

    const data = {
      ...form,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      birthday: form.birthday || null,
      address: form.address.trim() || null,
      company: form.company.trim() || null,
      job_title: form.job_title.trim() || null,
      photo_url: form.photo_url.trim() || null,
      notes: form.notes.trim() || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    onSave(data);
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <h2>{contact ? 'Edit Contact' : 'New Contact'}</h2>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="first_name">First Name *</label>
          <input
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input
            id="last_name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="birthday">Birthday</label>
          <input
            id="birthday"
            name="birthday"
            type="date"
            value={form.birthday}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="company">Company / Org</label>
          <input
            id="company"
            name="company"
            value={form.company}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="job_title">Job Title / Role</label>
          <input
            id="job_title"
            name="job_title"
            value={form.job_title}
            onChange={handleChange}
          />
        </div>

        <div className="form-group form-full">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="form-group form-full">
          <label htmlFor="photo_url">Photo URL</label>
          <input
            id="photo_url"
            name="photo_url"
            type="url"
            placeholder="https://..."
            value={form.photo_url}
            onChange={handleChange}
          />
        </div>

        <div className="form-group form-full">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            id="tags"
            name="tags"
            placeholder="e.g. college, hiking, book club"
            value={form.tags}
            onChange={handleChange}
          />
        </div>

        <div className="form-group form-full">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Anything you want to remember about this person..."
            value={form.notes}
            onChange={handleChange}
          />
        </div>

        <div className="form-group form-full">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="favorite"
              checked={form.favorite}
              onChange={handleChange}
            />
            Mark as favorite
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {contact ? 'Save Changes' : 'Create Contact'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
