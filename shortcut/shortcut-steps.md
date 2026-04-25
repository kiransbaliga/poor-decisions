# Shortcut Build Guide — iOS Expense Tracker

If you prefer to build the shortcut manually instead of downloading the pre-made one, follow these steps in the **Shortcuts app** on your iPhone.

---

## Prerequisites
- You've completed the Setup Wizard in Google Sheets and copied your Web App URL.

---

## Overview of Actions

```
[Text] "Poor Decisions" (Shortcut name)
 │
 ├─ 1. URL                       → Paste your Web App URL here
 ├─ 2. Set Variable              → api_url = URL
 │
 ├─ 3. Ask for Input (Text)      → "What is this expense about?"
 ├─ 4. Set Variable              → description
 │
 ├─ 5. Ask for Input (Number)    → "How much?"
 ├─ 6. Set Variable              → amount
 │
 ├─ 7. Ask for Input (Date)      → "Select date"
 ├─ 8. Format Date               → "yyyy-MM-dd" → date_formatted
 ├─ 9. Format Date               → "HH:mm"      → time_formatted
 │
 ├─10. Choose from List          → Category picker
 ├─11. Set Variable              → category
 │
 ├─12. Dictionary                → Build JSON payload
 ├─13. Get Contents of URL       → POST to URL (api_url variable)
 ├─14. Get Dictionary Value      → Extract "status" from response
 │
 ├─15. If (status = "success")
 │      └─ Show Notification     → ✅ "Logged"
 └─16. Otherwise
        └─ Show Alert            → ❌ "Sync failed." + response message
```

---

## Setup Steps

1. Download the shortcut from the website.
2. Open the **Shortcuts app** on your iPhone.
3. Tap the **three dots (...)** on the Poor Decisions shortcut to edit it.
4. In the very first action block, replace `<your-url-here>` with the **Web App URL** you copied from Google Apps Script (it should start with `https://script.google.com/...`).
5. Tap **Done** to save.

You are now ready to log your expenses!
