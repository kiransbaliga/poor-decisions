# 💸 Poor Decisions™

A zero-cost, serverless expense logging system. Log expenses in seconds from your iPhone using an iOS Shortcut directly into a beautiful Google Sheet.

**Now a distributable product.**

---

## The Setup Flow

1. **Website:** Head over to the Poor Decisions landing page (hosted in `docs/`).
2. **Copy the Sheet:** Click the link to copy the Google Sheets template.
3. **Wizard Setup:** The template includes an Apps Script Sidebar Wizard that will run `setup` for you automatically on open and help configure your custom Currency (`₹`, `$`, etc.)
4. **Download Shortcut:** Download the pre-built signed iCloud Shortcut from the website.
5. **Config:** Open the installed shortcut in your Shortcuts app and paste your Web App URL into the `<your-url-here>` placeholder.

---

## Features

- **No Apps/Subscriptions** — Built on iOS native Shortcuts & Google Apps Script
- **Simple URL Placement** — Easily paste the backend URL straight into the shortcut once globally.
- **Custom Currency** — Supports `₹`, `$`, `€`, or any custom currency via the Config sheet
- **Live dashboard** — Automatic category totals, and status warnings (🟢🟡🔴) based on budget limits.

---

## Project Structure

```
poor-decisions/
├── apps-script/
│   ├── Code.gs              ← Backend POST parser & spreadsheet updater
│   └── Setup.html           ← Beautiful HTML Sidebar UI for Google Sheets setup
├── docs/                    ← Static website (Ready for GitHub Pages Subdomain)
│   ├── index.html           
│   ├── style.css            
│   └── script.js            
├── sheets-template/
│   └── setup-guide.md       ← Instructions for setup mapping
└── shortcut/
    └── shortcut-steps.md    ← Breakdown of how the Shortcut logic works
```

---

## Deployment (GitHub Pages)

The website is located in the `docs/` directory.

To deploy it on a generic Subdomain or Custom Domain:
1. Push this repository to GitHub.
2. In the repository settings, go to **Pages**.
3. Select the `main` branch, and point the directory to `/docs`.
4. Add your custom domain (e.g. `poor-decisions.baliga.dev`) if you have one.
