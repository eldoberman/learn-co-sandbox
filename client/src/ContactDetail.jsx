import React, { useState, useEffect } from 'react';
import { api } from './api';
import InteractionList from './InteractionList';
import './ContactDetail.css';

const CATEGORY_EMOJI = {
  friend: '👋',
  family: '🏠',
  coworker: '💼',
  acquaintance: '🤝',
  pet: '🐾',
  other: '📌',
};

export default function ContactDetail({ contactId, onEdit, onDelete, onToggleFavorite }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.contacts.get(contactId).then((data) => {
      if (!cancelled) {
        setContact(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [contactId]);

  if (loading) return <div className="detail-loading">Loading...</div>;
  if (!contact) return <div className="detail-loading">Contact not found</div>;

  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();

  return (
    <div className="contact-detail">
      <div className="detail-header">
        <div className="detail-avatar">
          {contact.photo_url ? (
            <img src={contact.photo_url} alt="" />
          ) : (
            <span>{contact.first_name[0]}{contact.last_name ? contact.last_name[0] : ''}</span>
          )}
        </div>
        <div className="detail-title">
          <h2>
            {fullName}
            <button
              className="favorite-btn-lg"
              onClick={() => onToggleFavorite(contact.id)}
            >
              {contact.favorite ? '★' : '☆'}
            </button>
          </h2>
          <span className="detail-category">
            {CATEGORY_EMOJI[contact.category] || '📌'} {contact.category}
          </span>
          {contact.job_title && contact.company && (
            <span className="detail-role">{contact.job_title} at {contact.company}</span>
          )}
          {!contact.job_title && contact.company && (
            <span className="detail-role">{contact.company}</span>
          )}
          {contact.job_title && !contact.company && (
            <span className="detail-role">{contact.job_title}</span>
          )}
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={() => onEdit(contact)}>Edit</button>
          <button className="btn btn-danger" onClick={() => onDelete(contact.id)}>Delete</button>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-fields">
          {contact.email && (
            <div className="field">
              <label>Email</label>
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="field">
              <label>Phone</label>
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.birthday && (
            <div className="field">
              <label>Birthday</label>
              <span>{contact.birthday}</span>
            </div>
          )}
          {contact.address && (
            <div className="field">
              <label>Address</label>
              <span>{contact.address}</span>
            </div>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <div className="field">
              <label>Tags</label>
              <div className="tag-list">
                {contact.tags.map((tag) => (
                  <span key={tag.id} className="tag">{tag.name}</span>
                ))}
              </div>
            </div>
          )}
          {contact.notes && (
            <div className="field field-full">
              <label>Notes</label>
              <div className="notes-content">{contact.notes}</div>
            </div>
          )}
        </div>

        <InteractionList
          contactId={contact.id}
          interactions={contact.interactions || []}
        />
      </div>
    </div>
  );
}
