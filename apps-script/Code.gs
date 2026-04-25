// ============================================================
// Expense Tracker — Google Apps Script Backend
// ============================================================
// Deploy this as a Web App:
//   Execute as: Me
//   Who has access: Anyone
//
// The Web App URL is the only "secret". Keep it private.
// ============================================================

var CURRENCY = "₹";
var CATEGORIES = [
  "Food & Drink",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Bills & Utilities",
  "Other"
];

var DASHBOARD_SHEET_NAME = "🏠 Dashboard";
var CONFIG_SHEET_NAME    = "⚙️ Config";

// ------------------------------------------------------------
// Entry point — receives POST from iOS Shortcut
// ------------------------------------------------------------
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    var description = payload.description || "";
    var amount      = parseFloat(payload.amount) || 0;
    var date        = payload.date        || "";   // "YYYY-MM-DD"
    var time        = payload.time        || "";   // "HH:MM"
    var category    = payload.category    || "Other";

    if (!description || !amount || !date) {
      return jsonResponse({ status: "error", message: "Missing required fields: description, amount, date" });
    }

    // Validate category — fall back to "Other" if unknown
    if (CATEGORIES.indexOf(category) === -1) {
      category = "Other";
    }

    var monthSheetName = getMonthSheetName(date);
    var sheet = getOrCreateMonthSheet(monthSheetName, date);

    // Append row: [#, Date, Time, Description, Category, Amount]
    var lastRow   = sheet.getLastRow();
    var rowNumber = lastRow > 1 ? lastRow : 1; // header is row 1
    sheet.appendRow([
      rowNumber,          // row number (auto)
      formatDate(date),   // e.g. "25 Apr 2025"
      time,               // e.g. "10:30"
      description,
      category,
      amount
    ]);

    // Fix the row-number formula for the new row
    var newRow = sheet.getLastRow();
    sheet.getRange(newRow, 1).setValue(newRow - 1);

    // Refresh dashboard
    updateDashboard();

    return jsonResponse({
      status:  "success",
      message: "Expense logged: " + CURRENCY + amount + " for " + description,
      sheet:   monthSheetName,
      row:     newRow
    });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ------------------------------------------------------------
// Health check — GET request returns status
// ------------------------------------------------------------
function doGet(e) {
  return jsonResponse({ status: "ok", message: "Expense Tracker API is running." });
}

// ------------------------------------------------------------
// Get or create a monthly sheet (e.g. "Apr 2025")
// ------------------------------------------------------------
function getOrCreateMonthSheet(name, dateStr) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    setupMonthSheet(sheet, dateStr);
  }

  return sheet;
}

// ------------------------------------------------------------
// Initialise a new month sheet with headers + formatting
// ------------------------------------------------------------
function setupMonthSheet(sheet, dateStr) {
  // Headers
  var headers = ["#", "Date", "Time", "Description", "Category", "Amount (" + CURRENCY + ")"];
  sheet.appendRow(headers);

  // Style header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1a1a2e");
  headerRange.setFontColor("#e0e0ff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);

  // Freeze header row
  sheet.setFrozenRows(1);

  // Column widths
  sheet.setColumnWidth(1, 40);   // #
  sheet.setColumnWidth(2, 100);  // Date
  sheet.setColumnWidth(3, 70);   // Time
  sheet.setColumnWidth(4, 250);  // Description
  sheet.setColumnWidth(5, 140);  // Category
  sheet.setColumnWidth(6, 110);  // Amount

  // Alternating row color (applied by updateMonthSheetFormatting on each write)
}

// ------------------------------------------------------------
// Update the Dashboard sheet with current month's totals
// ------------------------------------------------------------
function updateDashboard() {
  var ss        = SpreadsheetApp.getActiveSpreadsheet();
  var dashboard = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  var config    = ss.getSheetByName(CONFIG_SHEET_NAME);

  if (!dashboard || !config) return;

  // Get current month sheet name
  var today          = new Date();
  var monthSheetName = getMonthSheetName(formatISODate(today));
  var monthSheet     = ss.getSheetByName(monthSheetName);

  // Read budgets from Config
  var configData = config.getDataRange().getValues();
  var budgets    = {};
  for (var i = 1; i < configData.length; i++) {
    var cat = configData[i][0];
    var bgt = configData[i][1];
    if (cat) budgets[cat] = bgt || 0;
  }

  // Tally spending per category from current month sheet
  var spending = {};
  CATEGORIES.forEach(function(cat) { spending[cat] = 0; });

  if (monthSheet) {
    var rows = monthSheet.getDataRange().getValues();
    for (var r = 1; r < rows.length; r++) {
      var cat    = rows[r][4];
      var amount = parseFloat(rows[r][5]) || 0;
      if (spending[cat] !== undefined) {
        spending[cat] += amount;
      } else {
        spending["Other"] += amount;
      }
    }
  }

  // Write to Dashboard (rows 4 onwards, cols A–F)
  // Layout:
  //   Row 1: Title
  //   Row 2: Month label
  //   Row 3: Column headers
  //   Row 4+: Category rows

  // Ensure headers exist (rows 1–3)
  dashboard.getRange("A1").setValue("💰 Expense Dashboard");
  dashboard.getRange("A1").setFontSize(16).setFontWeight("bold");

  dashboard.getRange("A2").setValue("Current Month: " + monthSheetName);
  dashboard.getRange("A2").setFontSize(11).setFontColor("#666666");

  var colHeaders = ["Category", "Budget (" + CURRENCY + ")", "Spent (" + CURRENCY + ")", "% Used", "Remaining", "Status"];
  dashboard.getRange(3, 1, 1, colHeaders.length).setValues([colHeaders]);
  dashboard.getRange(3, 1, 1, colHeaders.length)
    .setBackground("#1a1a2e")
    .setFontColor("#e0e0ff")
    .setFontWeight("bold");

  // Write category rows
  var totalBudget  = 0;
  var totalSpent   = 0;
  var dataRows     = [];

  CATEGORIES.forEach(function(cat) {
    var budget    = budgets[cat]   || 0;
    var spent     = spending[cat]  || 0;
    var pct       = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    var remaining = budget - spent;
    var status    = pct >= 100 ? "🔴 Over" : pct >= 80 ? "🟡 Near" : "🟢 OK";
    totalBudget  += budget;
    totalSpent   += spent;
    dataRows.push([cat, budget, spent, pct + "%", remaining, status]);
  });

  // Total row
  var totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  dataRows.push(["TOTAL", totalBudget, totalSpent, totalPct + "%", totalBudget - totalSpent, ""]);

  // Clear old data and write fresh
  dashboard.getRange(4, 1, 20, 6).clearContent().clearFormat();
  dashboard.getRange(4, 1, dataRows.length, 6).setValues(dataRows);

  // Highlight total row
  var totalRowIndex = 4 + CATEGORIES.length;
  dashboard.getRange(totalRowIndex, 1, 1, 6)
    .setBackground("#e8f5e9")
    .setFontWeight("bold");

  // Freeze header + title rows
  dashboard.setFrozenRows(3);
}

// ------------------------------------------------------------
// Setup the entire spreadsheet (run ONCE manually)
// ------------------------------------------------------------
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Dashboard sheet if missing
  if (!ss.getSheetByName(DASHBOARD_SHEET_NAME)) {
    ss.insertSheet(DASHBOARD_SHEET_NAME, 0);
  }

  // Create Config sheet if missing
  var config = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!config) {
    config = ss.insertSheet(CONFIG_SHEET_NAME);
    setupConfigSheet(config);
  }

  // Delete default "Sheet1" if it exists and is empty
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }

  updateDashboard();
  SpreadsheetApp.flush();
  Logger.log("Setup complete!");
}

// ------------------------------------------------------------
// Initialise the Config sheet with categories + default budgets
// ------------------------------------------------------------
function setupConfigSheet(sheet) {
  sheet.appendRow(["Category", "Monthly Budget (" + CURRENCY + ")"]);
  var headerRange = sheet.getRange(1, 1, 1, 2);
  headerRange.setBackground("#1a1a2e").setFontColor("#e0e0ff").setFontWeight("bold");

  var defaultBudgets = {
    "Food & Drink":      5000,
    "Transport":         3000,
    "Shopping":          4000,
    "Entertainment":     2000,
    "Health":            2000,
    "Bills & Utilities": 8000,
    "Other":             2000
  };

  CATEGORIES.forEach(function(cat) {
    sheet.appendRow([cat, defaultBudgets[cat] || 0]);
  });

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 180);
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function getMonthSheetName(isoDate) {
  // "2025-04-25" → "Apr 2025"
  var parts = isoDate.split("-");
  var d     = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[d.getMonth()] + " " + d.getFullYear();
}

function formatDate(isoDate) {
  // "2025-04-25" → "25 Apr 2025"
  var parts  = isoDate.split("-");
  var d      = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function formatISODate(date) {
  var y  = date.getFullYear();
  var m  = String(date.getMonth() + 1).padStart(2, "0");
  var d  = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
