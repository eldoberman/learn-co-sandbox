# Personal CRM

A personal CRM to track friendships, family, co-workers, acquaintances, pets, and everyone else in your life.

## Features

- **Contact Management** - Add, edit, and delete contacts with detailed information (name, email, phone, birthday, address, company, job title, photo, notes)
- **Categories** - Organize contacts as Friends, Family, Co-workers, Acquaintances, Pets, or Other
- **Tags** - Flexible tagging system for custom grouping (e.g. "college", "hiking", "book club")
- **Favorites** - Star important contacts for quick access
- **Search & Filter** - Full-text search across names, emails, companies, and notes. Filter by category or favorites
- **Interaction Log** - Track meetings, calls, messages, emails, gifts, and events with dates and notes
- **Persistent Storage** - SQLite database stores everything locally

## Tech Stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Frontend:** React 18, Vite
- **Database:** SQLite with WAL mode

## Getting Started

```bash
# Install all dependencies (server + client)
npm run setup

# Start development servers (API on :3001, UI on :5173)
npm run dev
```

For production:

```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts (query: `search`, `category`, `tag`, `favorite`) |
| GET | `/api/contacts/:id` | Get contact with tags and interactions |
| POST | `/api/contacts` | Create contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| PATCH | `/api/contacts/:id/favorite` | Toggle favorite |
| GET | `/api/interactions/contact/:id` | List interactions for a contact |
| POST | `/api/interactions` | Log an interaction |
| PUT | `/api/interactions/:id` | Update interaction |
| DELETE | `/api/interactions/:id` | Delete interaction |
| GET | `/api/tags` | List all tags with contact counts |
