import React from 'react';
import './ContactList.css';

const CATEGORY_EMOJI = {
  friend: '👋',
  family: '🏠',
  coworker: '💼',
  acquaintance: '🤝',
  pet: '🐾',
  other: '📌',
};

export default function ContactList({ contacts, selectedId, onSelect, onToggleFavorite, loading }) {
  if (loading) {
    return <div className="contact-list-empty">Loading...</div>;
  }

  if (contacts.length === 0) {
    return <div className="contact-list-empty">No contacts found</div>;
  }

  return (
    <div className="contact-list">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className={`contact-item ${selectedId === contact.id ? 'selected' : ''}`}
          onClick={() => onSelect(contact.id)}
        >
          <div className="contact-avatar">
            {contact.photo_url ? (
              <img src={contact.photo_url} alt="" />
            ) : (
              <span>{contact.first_name[0]}{contact.last_name ? contact.last_name[0] : ''}</span>
            )}
          </div>
          <div className="contact-info">
            <div className="contact-name">
              {contact.first_name} {contact.last_name || ''}
            </div>
            <div className="contact-meta">
              <span className="category-badge">
                {CATEGORY_EMOJI[contact.category] || '📌'} {contact.category}
              </span>
              {contact.company && <span className="contact-company">{contact.company}</span>}
            </div>
          </div>
          <button
            className="favorite-btn"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(contact.id); }}
            title={contact.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {contact.favorite ? '★' : '☆'}
          </button>
        </div>
      ))}
    </div>
  );
}
