# Google Sheets Setup Guide

Complete setup in ~10 minutes.

---

## Part 1 — Create the Google Sheet

1. Go to [sheets.new](https://sheets.new) to create a new spreadsheet
2. Rename it: **"Expense Tracker"** (top-left, click "Untitled spreadsheet")
3. Keep the default "Sheet1" for now — the script will clean it up

---

## Part 2 — Add the Apps Script

1. In your sheet, click **Extensions → Apps Script**
2. Delete all existing code in `Code.gs`
3. Copy the entire contents of [`../apps-script/Code.gs`](../apps-script/Code.gs) and paste it in
4. Click **💾 Save** (or Cmd+S)

---

## Part 3 — Run Initial Setup

1. In the Apps Script editor, select the function `setupSpreadsheet` from the dropdown (top bar)
2. Click **▶ Run**
3. You'll be prompted to **authorize access** — click "Review permissions" → choose your Google account → "Allow"
4. Run it again after authorizing

**What `setupSpreadsheet` does:**
- Creates the **🏠 Dashboard** sheet
- Creates the **⚙️ Config** sheet with default categories and budgets
- Removes the blank "Sheet1"
- Populates the Dashboard

---

## Part 4 — Customize Budgets (optional)

1. Go to the **⚙️ Config** sheet
2. Edit the **Monthly Budget (₹)** column for each category to match your spending limits

| Category | Default Budget |
|----------|---------------|
| Food & Drink | ₹5,000 |
| Transport | ₹3,000 |
| Shopping | ₹4,000 |
| Entertainment | ₹2,000 |
| Health | ₹2,000 |
| Bills & Utilities | ₹8,000 |
| Other | ₹2,000 |

---

## Part 5 — Deploy as Web App

1. In Apps Script, click **Deploy → New deployment**
2. Click the ⚙️ gear next to "Select type" → choose **Web app**
3. Configure:
   - **Description**: `Expense Tracker v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. Click **Authorize access** if prompted (same Google account)
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxx/exec
   ```

> ⚠️ **Keep this URL private.** It's your only authentication. Treat it like a password.

---

## Part 6 — Test the Web App

Open Terminal and run:

```bash
curl -L -X POST \
  -H "Content-Type: application/json" \
  -d '{"description":"Test coffee","amount":100,"date":"2025-04-25","time":"10:30","category":"Food & Drink"}' \
  "YOUR_WEB_APP_URL_HERE"
```

Expected response:
```json
{
  "status": "success",
  "message": "Expense logged: ₹100 for Test coffee",
  "sheet": "Apr 2025",
  "row": 2
}
```

You should see a new "Apr 2025" tab in your spreadsheet with one row of data.

---

## Re-deploying After Code Changes

Every time you update `Code.gs`, you must create a **new version**:

1. Apps Script → **Deploy → Manage deployments**
2. Click the ✏️ pencil (Edit) next to your deployment
3. Change **Version** from "Latest code" to **"New version"**
4. Click **Deploy**

> The URL stays the same across versions.

---

## Dashboard Auto-Refresh

The Dashboard updates automatically every time a new expense is logged via the shortcut. To manually refresh:

1. Apps Script editor → select `updateDashboard` → **▶ Run**

---

## Sheet Structure Reference

### 🏠 Dashboard
Auto-generated. Shows category budgets vs. actual spend for the current month.

| Column | Content |
|--------|---------|
| A | Category |
| B | Budget (₹) |
| C | Spent (₹) |
| D | % Used |
| E | Remaining (₹) |
| F | Status (🟢🟡🔴) |

### MMM YYYY (e.g. Apr 2025)
One tab per month, auto-created when the first expense for that month is logged.

| # | Date | Time | Description | Category | Amount (₹) |
|---|------|------|-------------|----------|------------|

### ⚙️ Config
Edit this to change category names or monthly budgets.

| Category | Monthly Budget (₹) |
|----------|--------------------|
