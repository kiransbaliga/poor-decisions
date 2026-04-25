# 💰 iOS Expense Tracker → Google Sheets

A zero-cost, serverless expense logging system. Log expenses in seconds from your iPhone using an iOS Shortcut — no app required. Data syncs automatically to a Google Sheet with monthly tabs, category budgets, and a live dashboard.

---

## Architecture

```
iPhone (iOS Shortcut)
  └── POST JSON
        └── Google Apps Script Web App (free middleware)
              └── Google Sheets (storage + dashboard)
```

**No helper app. No subscriptions. No API keys to manage.**

---

## Features

- **5-step logging flow** — description → amount → date/time → category → sync
- **Auto-creates monthly sheets** — "Apr 2025", "May 2025", etc.
- **Live dashboard** — category budgets vs. actual spend, traffic-light status
- **Success/failure notification** — retry on failure
- **Easy back-tap access** — log an expense with 2 taps on the back of your phone
- **Future-ready** — category field ready for auto-categorization from emails/messages

---

## Quick Start

### 1. Set up Google Sheets (10 min)
Follow [sheets-template/setup-guide.md](sheets-template/setup-guide.md)

### 2. Build the iOS Shortcut (15 min)
Follow [shortcut/shortcut-steps.md](shortcut/shortcut-steps.md)

### 3. Test end-to-end
Run the shortcut → enter test data → check your sheet

---

## Project Structure

```
expense-tracker/
├── apps-script/
│   └── Code.gs              ← Copy this into Google Apps Script
├── sheets-template/
│   └── setup-guide.md       ← Step-by-step Sheets + Apps Script setup
├── shortcut/
│   ├── shortcut-steps.md    ← Step-by-step iOS Shortcuts build guide
│   └── shortcut-payload.json ← Sample JSON the shortcut sends
└── README.md
```

---

## Categories

| Category | Default Budget |
|----------|---------------|
| Food & Drink | ₹5,000/mo |
| Transport | ₹3,000/mo |
| Shopping | ₹4,000/mo |
| Entertainment | ₹2,000/mo |
| Health | ₹2,000/mo |
| Bills & Utilities | ₹8,000/mo |
| Other | ₹2,000/mo |

Edit budgets anytime in the **⚙️ Config** sheet.

---

## API Reference

### POST `/exec`

Logs a single expense.

**Request body (JSON):**
```json
{
  "description": "Coffee at Blue Tokai",
  "amount": 250,
  "date": "2025-04-25",
  "time": "10:30",
  "category": "Food & Drink"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Expense logged: ₹250 for Coffee at Blue Tokai",
  "sheet": "Apr 2025",
  "row": 5
}
```

### GET `/exec`
Health check — returns `{ "status": "ok" }`.

---

## Roadmap

- [x] Manual expense logging via iOS Shortcut
- [x] Auto-create monthly sheets
- [x] Category budgets + dashboard
- [ ] Phase 2: Share Sheet trigger from Mail/Messages for auto-categorization
- [ ] Phase 3: Weekly/monthly summary notification via Shortcut automation
- [ ] Phase 4: SwiftUI companion app for offline analytics (optional)

---

## Security

The Apps Script Web App URL is the only authentication mechanism. Treat it like a password — do not share it publicly or commit it to version control.
