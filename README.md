# Personal CRM

A personal CRM to track friendships, family, co-workers, acquaintances, pets, and everyone else in your life.

## Features

- **Contact Management** - Add, edit, and delete contacts with detailed information (name, email, phone, birthday, address, company, job title, photo, notes)
- **Categories** - Organize contacts as Friends, Family, Co-workers, Acquaintances, Pets, or Other
- **Tags** - Flexible tagging system for custom grouping (e.g. "college", "hiking", "book club")
- **Favorites** - Star important contacts for quick access
- **Search & Filter** - Full-text search across names, emails, companies, and notes. Filter by category or favorites
- **Interaction Log** - Track meetings, calls, messages, emails, gifts, and events with dates and notes
- **Google Sheets Storage** - Store all your data in a Google Sheet you can view and organize anytime
- **Local Fallback** - Works offline with local SQLite if Google Sheets isn't configured
- **Mobile Friendly** - Responsive UI that works on phones

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React 18, Vite
- **Storage:** Google Sheets API (primary) or SQLite (fallback)

## Quick Start (Local Storage)

```bash
npm run setup
npm run dev
```

Open `http://localhost:5173` in your browser. Data is saved locally.

## Google Sheets Setup

To store your data in Google Sheets, follow these steps:

### 1. Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click **"Create Project"** (top bar) and give it a name like "Personal CRM"
3. Select the project

### 2. Enable the Google Sheets API

1. In the left sidebar, go to **APIs & Services > Library**
2. Search for **"Google Sheets API"**
3. Click it, then click **"Enable"**

### 3. Create a Service Account

1. Go to **APIs & Services > Credentials**
2. Click **"Create Credentials" > "Service Account"**
3. Give it a name like "crm-bot", click **"Done"**
4. Click on the service account you just created
5. Go to the **"Keys"** tab
6. Click **"Add Key" > "Create new key" > JSON**
7. A file downloads - rename it to `credentials.json`
8. Move it into the `learn-co-sandbox/` folder (same folder as package.json)

### 4. Create a Google Sheet and Share It

1. Go to https://docs.google.com/spreadsheets and create a new blank spreadsheet
2. Name it "Personal CRM" (or whatever you want)
3. Copy the spreadsheet ID from the URL - it's the long string between `/d/` and `/edit`
   - Example: `https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit`
4. Click **"Share"** in the top right
5. Paste the service account email (found in `credentials.json` under `client_email`, looks like `crm-bot@your-project.iam.gserviceaccount.com`)
6. Give it **Editor** access and click Send

### 5. Set the Spreadsheet ID

Create a file called `.env` in the project folder with:

```
SPREADSHEET_ID=your_spreadsheet_id_here
```

Or set it when running:

```bash
SPREADSHEET_ID=your_spreadsheet_id_here npm run dev
```

### 6. Run the app

```bash
npm run dev
```

You should see "Connected to Google Sheets" in the terminal. The app will automatically create tabs (Contacts, Tags, ContactTags, Interactions) in your spreadsheet with the right column headers.

Now everything you enter in the app shows up in your Google Sheet!

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
