# Shortcut Build Guide — iOS Expense Tracker

Build this shortcut manually in the **Shortcuts app** on your iPhone.

---

## Prerequisites
- You've completed the [Sheets setup guide](../sheets-template/setup-guide.md)
- You have your **Apps Script Web App URL** ready (looks like `https://script.google.com/macros/s/.../exec`)

---

## Overview of Actions

```
[Text] "Add Expense" (Shortcut name)
 │
 ├─ 1. Ask for Input (Text)      → "What is this expense about?"
 ├─ 2. Set Variable              → description
 │
 ├─ 3. Ask for Input (Number)    → "How much? (₹)"
 ├─ 4. Set Variable              → amount
 │
 ├─ 5. Ask for Input (Date)      → "Select date"
 ├─ 6. Format Date               → "yyyy-MM-dd" → date_formatted
 ├─ 7. Format Date               → "HH:mm"      → time_formatted
 │
 ├─ 8. Choose from List          → Category picker
 ├─ 9. Set Variable              → category
 │
 ├─10. Dictionary                → Build JSON payload
 ├─11. Get Contents of URL       → POST to Apps Script
 ├─12. Get Dictionary Value      → Extract "status" from response
 │
 ├─13. If (status = "success")
 │      └─ Show Notification     → ✅ "Logged: ₹<amount> — <description>"
 └─14. Otherwise
        └─ Show Alert            → ❌ "Sync failed. Tap to retry." + response message
```

---

## Step-by-Step Instructions

### Step 1 — Ask for expense description

1. Tap **+** to add action → search **"Ask for Input"**
2. Set **Input Type**: `Text`
3. Set **Prompt**: `What is this expense about?`
4. *(Optional)* Set **Default Answer**: leave blank

### Step 2 — Save description to variable

1. Add action → **"Set Variable"**
2. Variable name: `description`
3. Input: the output from Step 1 (`Provided Input`)

### Step 3 — Ask for amount

1. Add action → **"Ask for Input"**
2. Set **Input Type**: `Number`
3. Set **Prompt**: `How much? (₹)`
4. Set **Default Answer**: `0`

### Step 4 — Save amount to variable

1. Add action → **"Set Variable"**
2. Variable name: `amount`
3. Input: output from Step 3

### Step 5 — Date & Time picker

1. Add action → **"Ask for Input"**
2. Set **Input Type**: `Date and Time`
3. Set **Prompt**: `When was this expense?`
4. Set **Default**: `Current Date`

> This single picker captures both date and time.

### Step 6 — Format date (for API)

1. Add action → **"Format Date"**
2. Input: output from Step 5
3. Set **Date Format**: `Custom`
4. Custom format: `yyyy-MM-dd`
5. Save to variable: `date_formatted`

### Step 7 — Format time (for API)

1. Add action → **"Format Date"**
2. Input: output from Step 5
3. Set **Date Format**: `Custom`
4. Custom format: `HH:mm`
5. Save to variable: `time_formatted`

### Step 8 — Category picker

1. Add action → **"Choose from List"**
2. Set **Prompt**: `Category (optional — tap Cancel to skip)`
3. List items (add each one):
   - `Food & Drink`
   - `Transport`
   - `Shopping`
   - `Entertainment`
   - `Health`
   - `Bills & Utilities`
   - `Other`
4. Enable **"Allow Cancelling"** → Yes
5. Save to variable: `category`

> If the user cancels, `category` will be empty. The Apps Script defaults it to "Other".

### Step 9 — Build JSON payload

1. Add action → **"Dictionary"**
2. Add four keys:

| Key | Type | Value |
|-----|------|-------|
| `description` | Text | Variable: `description` |
| `amount` | Number | Variable: `amount` |
| `date` | Text | Variable: `date_formatted` |
| `time` | Text | Variable: `time_formatted` |
| `category` | Text | Variable: `category` |

### Step 10 — Send POST request

1. Add action → **"Get Contents of URL"**
2. URL: `[PASTE YOUR APPS SCRIPT WEB APP URL HERE]`
3. Method: `POST`
4. Request Body: `JSON`
5. JSON Body: the Dictionary from Step 9
6. Save result to variable: `api_response`

### Step 11 — Parse response

1. Add action → **"Get Dictionary from Input"**
2. Input: `api_response`
3. Save to variable: `response_dict`

1. Add action → **"Get Dictionary Value"**
2. Dictionary: `response_dict`
3. Key: `status`
4. Save to variable: `status`

### Step 12 — If success, show notification

1. Add action → **"If"**
2. Input: `status`
3. Condition: `is` → `success`

**Inside the If block:**

1. Add action → **"Show Notification"**
2. Title: `✅ Expense Logged`
3. Body: `₹` + Variable:`amount` + ` — ` + Variable:`description`

### Step 13 — Otherwise, show retry alert

**In the Otherwise block:**

1. Add action → **"Get Dictionary Value"**
2. Dictionary: `response_dict`
3. Key: `message`
4. Save to variable: `error_message`

1. Add action → **"Show Alert"**
2. Title: `❌ Sync Failed`
3. Message: Variable:`error_message`
4. *(This lets you read the error and manually retry)*

---

## Testing the Shortcut

1. Run the shortcut from the Shortcuts app
2. Fill in all steps with test data:
   - Description: `Test coffee`
   - Amount: `100`
   - Date/Time: now
   - Category: `Food & Drink`
3. You should get a ✅ notification
4. Open Google Sheets → the current month tab should have a new row

---

## Adding to Home Screen / Back Tap

**Home Screen:**  
Shortcut app → Long press shortcut → "Add to Home Screen"

**Back Tap (fastest access):**  
Settings → Accessibility → Touch → Back Tap → Double Tap → select your shortcut

This lets you log an expense with **2 taps on the back of your phone**.
