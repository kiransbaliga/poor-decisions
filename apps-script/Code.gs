// ============================================================
// Poor Decisions™ Expense Tracker — Google Apps Script Backend
// ============================================================

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
// Add custom menu to the spreadsheet on open
// ------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Poor Decisions™')
      .addItem('Start Setup Wizard', 'showSetupSidebar')
      .addItem('Update Dashboard', 'updateDashboard')
      .addToUi();
  
  try {
    // If property setup_complete is not true, show sidebar automatically
    var props = PropertiesService.getDocumentProperties();
    if (props.getProperty('setup_complete') !== 'true') {
      showSetupSidebar();
    }
  } catch(e) {
    // Fails silently if properties need authorization before first run
  }
}

// ------------------------------------------------------------
// Show the sidebar with the setup wizard HTML
// ------------------------------------------------------------
function showSetupSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Setup')
      .setTitle('Poor Decisions™ Setup')
      .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ------------------------------------------------------------
// Run setup from the sidebar (creates sheets, config)
// ------------------------------------------------------------
function runAutomatedSetup(currencySymbol) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create Config sheet if missing
    var config = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!config) {
      config = ss.insertSheet(CONFIG_SHEET_NAME);
      setupConfigSheet(config, currencySymbol || "₹");
    }

    // Create Dashboard sheet if missing
    if (!ss.getSheetByName(DASHBOARD_SHEET_NAME)) {
      ss.insertSheet(DASHBOARD_SHEET_NAME, 0);
    }

    // Delete default "Sheet1" if it exists and is empty
    var defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet && defaultSheet.getLastRow() <= 1) {
      ss.deleteSheet(defaultSheet);
    }

    updateDashboard();
    SpreadsheetApp.flush();
    
    // Mark setup as complete
    PropertiesService.getDocumentProperties().setProperty('setup_complete', 'true');
    
    return { success: true, message: "Sheets created successfully!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ------------------------------------------------------------
// Get Currency configured in the sheet
// ------------------------------------------------------------
function getConfiguredCurrency() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!config) return "₹"; // fallback
  
  // Look for currency setting in columns D and E
  var data = config.getDataRange().getValues();
  for (var r = 0; r < data.length; r++) {
    if (data[r][3] === "Currency Symbol" && data[r][4]) {
      return data[r][4];
    }
  }
  return "₹";
}

// ------------------------------------------------------------
// Initialise the Config sheet with categories + settings
// ------------------------------------------------------------
function setupConfigSheet(sheet, currencySymbol) {
  sheet.appendRow(["Category", "Monthly Budget"]);
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

  var rowIndex = 2;
  CATEGORIES.forEach(function(cat) {
    sheet.getRange(rowIndex, 1).setValue(cat);
    sheet.getRange(rowIndex, 2).setValue(defaultBudgets[cat] || 0);
    rowIndex++;
  });

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 180);
  
  // Add Settings area
  sheet.getRange("D1").setValue("Setting").setBackground("#1a1a2e").setFontColor("#e0e0ff").setFontWeight("bold");
  sheet.getRange("E1").setValue("Value").setBackground("#1a1a2e").setFontColor("#e0e0ff").setFontWeight("bold");
  sheet.getRange("D2").setValue("Currency Symbol");
  sheet.getRange("E2").setValue(currencySymbol);
  
  sheet.setColumnWidth(4, 160);
  sheet.setColumnWidth(5, 120);
}

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

    var curr = getConfiguredCurrency();

    // Validate category — fall back to "Other" if unknown
    if (CATEGORIES.indexOf(category) === -1) {
      category = "Other";
    }

    var monthSheetName = getMonthSheetName(date);
    var sheet = getOrCreateMonthSheet(monthSheetName, date, curr);

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
      message: "Expense logged: " + curr + amount + " for " + description,
      sheet:   monthSheetName,
      row:     newRow
    });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  return jsonResponse({ status: "ok", message: "Poor Decisions API is running." });
}

function getOrCreateMonthSheet(name, dateStr, curr) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    setupMonthSheet(sheet, dateStr, curr);
  }

  return sheet;
}

function setupMonthSheet(sheet, dateStr, curr) {
  var headers = ["#", "Date", "Time", "Description", "Category", "Amount (" + curr + ")"];
  sheet.appendRow(headers);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1a1a2e").setFontColor("#e0e0ff").setFontWeight("bold").setFontSize(11);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 40);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 70);
  sheet.setColumnWidth(4, 250);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 110);
}

function updateDashboard() {
  var ss        = SpreadsheetApp.getActiveSpreadsheet();
  var dashboard = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  var config    = ss.getSheetByName(CONFIG_SHEET_NAME);

  if (!dashboard || !config) return;

  var curr = getConfiguredCurrency();
  var today          = new Date();
  var monthSheetName = getMonthSheetName(formatISODate(today));
  var monthSheet     = ss.getSheetByName(monthSheetName);

  var configData = config.getDataRange().getValues();
  var budgets    = {};
  for (var i = 1; i < configData.length; i++) {
    var cat = configData[i][0];
    var bgt = configData[i][1];
    if (cat && cat !== "Setting") budgets[cat] = bgt || 0;
  }

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

  dashboard.getRange("A1").setValue("💰 Poor Decisions Dashboard").setFontSize(16).setFontWeight("bold");
  dashboard.getRange("A2").setValue("Current Month: " + monthSheetName).setFontSize(11).setFontColor("#666666");

  var colHeaders = ["Category", "Budget (" + curr + ")", "Spent (" + curr + ")", "% Used", "Remaining", "Status"];
  dashboard.getRange(3, 1, 1, colHeaders.length).setValues([colHeaders])
    .setBackground("#1a1a2e").setFontColor("#e0e0ff").setFontWeight("bold");

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

  var totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  dataRows.push(["TOTAL", totalBudget, totalSpent, totalPct + "%", totalBudget - totalSpent, ""]);

  dashboard.getRange(4, 1, 20, 6).clearContent().clearFormat();
  dashboard.getRange(4, 1, dataRows.length, 6).setValues(dataRows);

  var totalRowIndex = 4 + CATEGORIES.length;
  dashboard.getRange(totalRowIndex, 1, 1, 6).setBackground("#e8f5e9").setFontWeight("bold");
  dashboard.setFrozenRows(3);
}

function getMonthSheetName(isoDate) {
  var parts = isoDate.split("-");
  var d     = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[d.getMonth()] + " " + d.getFullYear();
}

function formatDate(isoDate) {
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
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
