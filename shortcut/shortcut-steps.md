# Shortcut Build Guide — iOS Expense Tracker

If you prefer to build the shortcut manually instead of downloading the pre-made one, follow these steps in the **Shortcuts app** on your iPhone.

---

## Prerequisites
- You've completed the Setup Wizard in Google Sheets and copied your Web App URL.
- Make sure iCloud Drive is enabled for the Shortcuts app.

---

## Overview of Actions

```
[Text] "Poor Decisions" (Shortcut name)
 │
 ├─ 1. Get File                  → from iCloud Drive/Shortcuts/expense-config.txt
 │                              (Disable "Error if Not Found")
 ├─ 2. If (File has any value)
 │      └─ 3. Set Variable       → api_url = File
 ├─ 4. Otherwise
 │      ├─ 5. Ask for Input      → "Paste your Apps Script Web App URL"
 │      ├─ 6. Save File          → Input to iCloud Drive/Shortcuts/expense-config.txt
 │      └─ 7. Set Variable       → api_url = Input
 │
 ├─ 8. Ask for Input (Text)      → "What is this expense about?"
 ├─ 9. Set Variable              → description
 │
 ├─10. Ask for Input (Number)    → "How much?"
 ├─11. Set Variable              → amount
 │
 ├─12. Ask for Input (Date)      → "Select date"
 ├─13. Format Date               → "yyyy-MM-dd" → date_formatted
 ├─14. Format Date               → "HH:mm"      → time_formatted
 │
 ├─15. Choose from List          → Category picker
 ├─16. Set Variable              → category
 │
 ├─17. Dictionary                → Build JSON payload
 ├─18. Get Contents of URL       → POST to URL (api_url variable)
 ├─19. Get Dictionary Value      → Extract "status" from response
 │
 ├─20. If (status = "success")
 │      └─ Show Notification     → ✅ "Logged"
 └─21. Otherwise
        └─ Show Alert            → ❌ "Sync failed." + response message
```

---

## First Run Configuration Magic

The unique part of this shortcut is steps 1-7. 

By using the **Get File** action pointing to `/Shortcuts/expense-config.txt`, the shortcut will check if you've already configured your URL. 
- The first time you run it, it won't find the file, so it asks you to paste the URL and saves it.
- **Every time you run it after that**, it silently reads the configuration and instantly asks "What is this expense about?", bypassing the setup screen.

---

## Testing the Shortcut

1. Run the shortcut from the Shortcuts app.
2. It should prompt you: "Paste your Apps Script Web App URL".
3. Paste the URL starting with `https://script.google.com/...`.
4. Make a test log.
5. Run the shortcut a **second time**. It should immediately ask "What is this expense about?" — proving the first-run config worked!
