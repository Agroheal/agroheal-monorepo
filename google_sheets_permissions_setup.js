/**
 * ============================================================================
 * 🌾 AGROHEAL MASTER AUDIT WORKBOOK — DYNAMIC RATES (SLOT & MONTHLY) & ROLES
 * ============================================================================
 * 
 * 💡 WHAT THIS SCRIPT DOES:
 * 1. 🏷️ FULLY EDITABLE RATES (SLOT RATE & MONTHLY RATE):
 *    - Puts TWO clearly visible, highlighted input boxes in Row 2 of each Farm tab:
 *      * Cell I2: 🏷️ SLOT RATE (₦)     [e.g. ₦2,000 for Gingertown | ₦5,000 for Mushroom]
 *      * Cell K2: 📅 MONTHLY RATE (₦)  [e.g. ₦500 for Gingertown | ₦1,000 for Mushroom]
 *    - Both cells are 100% editable on the sheet, or via the top menu popup dialog.
 * 
 * 2. ⚙️ TWO-STEP INTERACTIVE POPUP:
 *    - Click "🌾 AgroHeal Admin" -> "⚙️ Edit Farm Rates (Slot & Monthly)"
 *    - Step 1: Prompt for Slot Rate (₦)
 *    - Step 2: Prompt for Monthly Support Rate (₦)
 *    - Automatically updates Cells I2 & K2 and recalculates the whole sheet!
 * 
 * 3. 🟢 FLEXIBLE SMART RECONCILIATION:
 *    - Total Expected formula handles both slots, setup, and monthly support:
 *      * If someone entered months (e.g. 12 months): converts (Months * MonthlyRate * Slots).
 *      * If someone entered full Naira (e.g. ₦60,000): uses the Naira amount directly.
 *    - Perfectly reconciles both legacy lump sums and new slot rates!
 * ============================================================================
 */

// 👑 ADMIN TEAM
const DEV_EMAIL = 'developerelijah360@gmail.com';    // Lead Developer
const CO_FOUNDER_EMAIL = 'estherbola888@gmail.com';  // Co-Founder
const ADMIN_TEAM = [DEV_EMAIL, CO_FOUNDER_EMAIL];

// 🏷️ DEFAULT PROJECT RATES MAPPING
const FARM_RATES = {
  // Gingertown Farms (₦2,000 per slot, ₦500 per month)
  'FARM_Alpha': { slotRate: 2000, monthlyRate: 500, category: 'Gingertown' },
  'FARM_Favoured_Town': { slotRate: 2000, monthlyRate: 500, category: 'Gingertown' },
  'FARM_Gingertown_Pioneers': { slotRate: 2000, monthlyRate: 500, category: 'Gingertown' },
  'FARM_Gingertown_Goshen': { slotRate: 2000, monthlyRate: 500, category: 'Gingertown' },
  'FARM_Pacesetters': { slotRate: 2000, monthlyRate: 500, category: 'Gingertown' },
  'FARM_Sustenance': { slotRate: 2000, monthlyRate: 500, category: 'Gingertown' },

  // Mushroom Village Farms (₦5,000 per slot, ₦1,000 per month)
  'FARM_Alpha_Mushroom': { slotRate: 5000, monthlyRate: 1000, category: 'Mushroom Village' },
  'FARM_Eagles': { slotRate: 5000, monthlyRate: 1000, category: 'Mushroom Village' },
  'FARM_Favoured_Community': { slotRate: 5000, monthlyRate: 1000, category: 'Mushroom Village' },
  'FARM_Mushroom_Goshen': { slotRate: 5000, monthlyRate: 1000, category: 'Mushroom Village' },
  'FARM_Pacesetter': { slotRate: 5000, monthlyRate: 1000, category: 'Mushroom Village' },
  'FARM_Pioneers': { slotRate: 5000, monthlyRate: 1000, category: 'Mushroom Village' },
  'FARM_Sustenance_Farming': { slotRate: 5000, monthlyRate: 1000, category: 'Mushroom Village' }
};

// 👨‍💼 FARM COORDINATORS MAPPING
const FARM_COORDINATORS = {
  'FARM_Alpha': ['adeiefonltd@gmail.com'],
  'FARM_Alpha_Mushroom': ['adeiefonltd@gmail.com'],
  'FARM_Eagles': ['estherbola888@gmail.com'],
  'FARM_Favoured_Community': ['abosedekanmi@gmail.com'],
  'FARM_Favoured_Town': ['abosedekanmi@gmail.com'],
  'FARM_Gingertown_Pioneers': ['bukikogbe@gmail.com'],
  'FARM_Pioneers': ['bukikogbe@gmail.com'],
  'FARM_Gingertown_Goshen': ['philipoladeni52@gmail.com'],
  'FARM_Mushroom_Goshen': ['philipoladeni52@gmail.com'],
  'FARM_Pacesetter': ['efortunefb@gmail.com'],
  'FARM_Pacesetters': ['efortunefb@gmail.com'],
  'FARM_Sustenance': ['oyekantaofikg@gmail.com'],
  'FARM_Sustenance_Farming': ['oyekantaofikg@gmail.com']
};

const ADMIN_SHEET_NAMES = [
  '01_AUDIT_DASHBOARD',
  '02_MASTER_USERS_DIRECTORY',
  'ALL_FARM_EXPENSES_ROLLUP',
  'DB_RE_IMPORT_PAYLOAD'
];

/**
 * Creates custom top menu when spreadsheet is opened.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌾 AgroHeal Admin')
    .addItem('⚙️ Edit Farm Rates (Slot & Monthly)', 'editFarmRatesDialog')
    .addSeparator()
    .addItem('⚡ Apply Dynamic Rates & Reconcile (All 13 Farms)', 'reconcileLegacyFarmData')
    .addSeparator()
    .addItem('🔒 Hide Admin Vault (Coordinators View)', 'hideAdminSheets')
    .addItem('👁️ Show Admin Vault (Lead Dev & Co-Founder View)', 'showAdminSheets')
    .addSeparator()
    .addItem('🔒 Lock Roles & Permissions', 'setupAgroHealSystem')
    .addToUi();
}

/**
 * ⚙️ POPUP DIALOG: Prompts user to enter/edit BOTH Slot Rate & Monthly Rate!
 */
function editFarmRatesDialog() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();

  if (!sheetName.startsWith('FARM_')) {
    ui.alert('⚠️ Please switch to a Farm tab (e.g. FARM_Alpha) before editing farm rates.');
    return;
  }

  const currentSlotRate = sheet.getRange('I2').getValue() || 2000;
  const currentMonthlyRate = sheet.getRange('K2').getValue() || 500;

  // Step 1: Prompt for Slot Rate
  const slotPrompt = ui.prompt(
    `⚙️ [${sheetName}] — STEP 1 OF 2: SLOT RATE`,
    `Enter the Rate Per Slot in Naira:\n(Current: ₦${Number(currentSlotRate).toLocaleString()})`,
    ui.ButtonSet.OK_CANCEL
  );

  if (slotPrompt.getSelectedButton() !== ui.Button.OK) return;
  const newSlotRate = parseFloat(slotPrompt.getResponseText().replace(/[^0-9.]/g, ''));
  if (isNaN(newSlotRate) || newSlotRate <= 0) {
    ui.alert('❌ Invalid slot rate entered. Please enter a valid number (e.g. 2000 or 5000).');
    return;
  }

  // Step 2: Prompt for Monthly Support Rate
  const monthlyPrompt = ui.prompt(
    `⚙️ [${sheetName}] — STEP 2 OF 2: MONTHLY SUPPORT RATE`,
    `Enter the Monthly Support/Maintenance Rate in Naira:\n(Current: ₦${Number(currentMonthlyRate).toLocaleString()})`,
    ui.ButtonSet.OK_CANCEL
  );

  if (monthlyPrompt.getSelectedButton() !== ui.Button.OK) return;
  const newMonthlyRate = parseFloat(monthlyPrompt.getResponseText().replace(/[^0-9.]/g, ''));
  if (isNaN(newMonthlyRate) || newMonthlyRate < 0) {
    ui.alert('❌ Invalid monthly rate entered. Please enter a valid number (e.g. 500 or 1000).');
    return;
  }

  // Update Cells I2 & K2 directly on the sheet
  sheet.getRange('I2').setValue(newSlotRate).setNumberFormat('₦#,##0');
  sheet.getRange('K2').setValue(newMonthlyRate).setNumberFormat('₦#,##0');

  ui.alert(
    `Rates Updated Successfully! 🎉\n\n` +
    `Tab: ${sheetName}\n` +
    `• 🏷️ Slot Rate: ₦${newSlotRate.toLocaleString()}\n` +
    `• 📅 Monthly Rate: ₦${newMonthlyRate.toLocaleString()}\n\n` +
    `All member formulas on this tab have automatically recalculated!`
  );
}

/**
 * ⚡ RECONCILIATION & RATE BOX SETUP:
 * Configures Cells I2 (Slot Rate) & K2 (Monthly Rate) on all 13 farm sheets!
 */
function reconcileLegacyFarmData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let farmCount = 0;

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (!name.startsWith('FARM_')) return;

    const rateInfo = FARM_RATES[name] || { slotRate: 5000, monthlyRate: 1000, category: 'General' };

    // 1. Configure Rate Inputs in Row 2
    // A. Slot Rate Label & Box
    sheet.getRange('H2').setValue('🏷️ SLOT RATE (₦):')
      .setFontWeight('bold')
      .setFontColor('#0F172A')
      .setHorizontalAlignment('right');

    sheet.getRange('I2').setValue(rateInfo.slotRate)
      .setNumberFormat('₦#,##0')
      .setFontWeight('bold')
      .setBackground('#FEF3C7') // Light amber highlight
      .setFontColor('#92400E')
      .setHorizontalAlignment('center');

    // B. Monthly Rate Label & Box
    sheet.getRange('J2').setValue('📅 MONTHLY RATE (₦):')
      .setFontWeight('bold')
      .setFontColor('#0F172A')
      .setHorizontalAlignment('right');

    sheet.getRange('K2').setValue(rateInfo.monthlyRate)
      .setNumberFormat('₦#,##0')
      .setFontWeight('bold')
      .setBackground('#E0E7FF') // Light indigo highlight
      .setFontColor('#3730A3')
      .setHorizontalAlignment('center');

    // 2. Correct Column Headers in Row 11
    sheet.getRange('H11').setValue('SETUP_PAID (₦) [✏️]');
    sheet.getRange('I11').setValue('SUPPORT_PAID (₦) [✏️]');
    sheet.getRange('M11').setValue('TOTAL_EXPECTED (₦) [Slots+Setup+Support]');

    // 3. Find Member Roster range (Row 12 down to Section 2 Expenses)
    const lastRow = Math.max(sheet.getLastRow(), 25);
    let rosterEnd = lastRow;
    for (let r = 12; r <= lastRow; r++) {
      const val = String(sheet.getRange(r, 1).getValue() || '');
      if (val.includes('SECTION 2') || val.includes('OPERATING EXPENSES')) {
        rosterEnd = r - 2;
        break;
      }
    }

    // 4. Update Financial Formulas on all member rows
    if (rosterEnd >= 12) {
      for (let r = 12; r <= rosterEnd; r++) {
        const memberEmail = sheet.getRange(r, 4).getValue();
        if (memberEmail || r === 12) {
          // Format Setup & Support values as Currency
          sheet.getRange(r, 8).setNumberFormat('₦#,##0.00'); // Setup Paid (H)
          sheet.getRange(r, 9).setNumberFormat('₦#,##0.00'); // Support Paid (I)

          // SMART FORMULA:
          // Slots * SlotRate(I2) + SetupPaid(H) + (SupportPaid(I), or if months <= 36, months * MonthlyRate(K2) * Slots)
          sheet.getRange(r, 13).setFormula(
            `=(G${r}*$I$2)+` +
            `IF(ISNUMBER(H${r}), H${r}, 0)+` +
            `IF(ISNUMBER(I${r}), IF(I${r}<=36, I${r}*$K$2*G${r}, I${r}), 0)`
          );

          // Variance: System Verified Cash (N) - Total Expected (M)
          sheet.getRange(r, 15).setFormula(`N${r}-M${r}`);

          // Exact Match Detector Badge
          sheet.getRange(r, 16).setFormula(`IF(ABS(O${r})<1, "🟢 EXACT MATCH", IF(O${r}<0, "🔴 DEFICIT: -₦" & TEXT(ABS(O${r}), "#,##0"), "🟡 SURPLUS: +₦" & TEXT(O${r}, "#,##0")))`);
        }
      }

      // 5. Update Top Summary KPI Card (Row 2)
      sheet.getRange('B2').setFormula(`SUM(G12:G${rosterEnd})`);
      sheet.getRange('C2').setFormula(`SUM(M12:M${rosterEnd})`);
      sheet.getRange('D2').setFormula(`SUM(N12:N${rosterEnd})`);
      sheet.getRange('F2').setFormula(`D2-C2`);
      sheet.getRange('G2').setFormula(`IF(ABS(F2)<1, "🟢 EXACT MATCH", IF(F2<0, "🔴 DEFICIT: -₦" & TEXT(ABS(F2), "#,##0"), "🟡 SURPLUS: +₦" & TEXT(F2, "#,##0")))`);
    }

    farmCount++;
    Logger.log(`✅ [${name}] configured: Slot Rate ₦${rateInfo.slotRate}, Monthly Rate ₦${rateInfo.monthlyRate}`);
  });

  SpreadsheetApp.getUi().alert(
    `Dynamic Rates & Reconciliation Complete! 🎉\n\n` +
    `Configured all ${farmCount} Farm tabs:\n` +
    `1. 🏷️ Slot Rate Box: Cell I2 (₦2k for Gingertown | ₦5k for Mushroom)\n` +
    `2. 📅 Monthly Rate Box: Cell K2 (₦500 for Gingertown | ₦1k for Mushroom)\n` +
    `3. ✏️ Both boxes are unlocked & editable directly, or via "🌾 AgroHeal Admin" -> "⚙️ Edit Farm Rates"!\n` +
    `4. 🟢 Formulas dynamically calculate against both rates.`
  );
}

/**
 * 🔒 Hides Admin Vault Sheets so coordinators only see farm rosters.
 */
function hideAdminSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let count = 0;
  ADMIN_SHEET_NAMES.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      try {
        sheet.hideSheet();
        count++;
      } catch (e) {
        Logger.log(`Notice for [${name}]: ${e.message}`);
      }
    }
  });
  SpreadsheetApp.getUi().alert(
    `🔒 Admin Vault Hidden (${count} sheets)\n\n` +
    `The Master Users Directory, Audit Dashboard, Rollup, and Payload tabs are now hidden from the bottom tab bar.\n\n` +
    `To view them again anytime, click: "🌾 AgroHeal Admin" -> "👁️ Show Admin Vault".`
  );
}

/**
 * 👁️ Unhides Admin Vault Sheets for Lead Dev and Co-Founder.
 */
function showAdminSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let count = 0;
  ADMIN_SHEET_NAMES.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      try {
        sheet.showSheet();
        count++;
      } catch (e) {
        Logger.log(`Notice for [${name}]: ${e.message}`);
      }
    }
  });
  SpreadsheetApp.getUi().alert(
    `👁️ Admin Vault Visible (${count} sheets)\n\n` +
    `All sheets (01_AUDIT_DASHBOARD, 02_MASTER_USERS_DIRECTORY, ALL_FARM_EXPENSES_ROLLUP, DB_RE_IMPORT_PAYLOAD) are now visible!`
  );
}

/**
 * Locks down Roles and Permissions across all sheets.
 */
function setupAgroHealSystem() {
  // First run reconciliation to ensure correct formulas & headers
  reconcileLegacyFarmData();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  Logger.log('==================================================================');
  Logger.log('🔒 APPLYING ROLE-BASED ACCESS & PERMISSIONS');
  Logger.log('==================================================================');

  // Build validation rules
  const memberVerdictRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'VERIFIED CORRECT ✅', 'FLAGGED AS WRONG ❌'])
    .setAllowInvalid(false)
    .build();

  const coordStageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING REVIEW', 'COORDINATOR SUBMITTED FOR REVIEW'])
    .setAllowInvalid(false)
    .build();

  const founderVerdictRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING FOUNDER REVIEW', 'FOUNDER APPROVED ✅', 'FLAGGED - CASH VARIANCE ❌'])
    .setAllowInvalid(false)
    .build();

  const receiptRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['YES - VERIFIED', 'NO - PENDING'])
    .setAllowInvalid(false)
    .build();

  const expFounderRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING FOUNDER REVIEW', 'APPROVED ✅', 'FLAGGED ❌'])
    .setAllowInvalid(false)
    .build();

  // Clear legacy protections
  const existingSheetProtections = ss.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (let i = 0; i < existingSheetProtections.length; i++) {
    existingSheetProtections[i].remove();
  }
  const existingRangeProtections = ss.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (let i = 0; i < existingRangeProtections.length; i++) {
    existingRangeProtections[i].remove();
  }

  // Register editors
  try { ss.addEditors(ADMIN_TEAM); } catch (e) {}
  const allCoordEmails = [...new Set(Object.values(FARM_COORDINATORS).flat())];
  try { ss.addEditors(allCoordEmails); } catch (e) {}

  sheets.forEach(sheet => {
    const name = sheet.getName();
    const lastRow = Math.max(sheet.getLastRow(), 25);

    // Admin Vault Tabs
    if (ADMIN_SHEET_NAMES.includes(name)) {
      if (name === '02_MASTER_USERS_DIRECTORY') {
        sheet.getRange('B6:B' + lastRow).setDataValidation(memberVerdictRule);
      }
      const p = sheet.protect().setDescription(`Admin Vault: ${name}`);
      p.removeEditors(p.getEditors());
      p.addEditors(ADMIN_TEAM);
      if (p.canDomainEdit()) p.setDomainEdit(false);
      return;
    }

    // Farm Tabs
    if (name.startsWith('FARM_')) {
      // Dropdowns
      sheet.getRange('B3').setDataValidation(coordStageRule);
      sheet.getRange('B4').setDataValidation(founderVerdictRule);
      sheet.getRange('A12:A' + lastRow).setDataValidation(memberVerdictRule);

      for (let r = 14; r <= lastRow; r++) {
        const val = String(sheet.getRange(r, 1).getValue());
        if (val.includes('EXP-') || val.length === 36) {
          sheet.getRange(r, 6).setDataValidation(receiptRule);
          sheet.getRange(r, 8).setDataValidation(expFounderRule);
        }
      }

      // Protection
      const sheetProtection = sheet.protect().setDescription(`Farm Roster: ${name}`);
      sheetProtection.removeEditors(sheetProtection.getEditors());
      sheetProtection.addEditors(ADMIN_TEAM);
      if (sheetProtection.canDomainEdit()) sheetProtection.setDomainEdit(false);

      const assignedCoords = FARM_COORDINATORS[name] || [];
      const allowedEditors = [...new Set([...ADMIN_TEAM, ...assignedCoords])];
      const unprotected = [];

      // Unlocked rate boxes: Slot Rate (I2) and Monthly Rate (K2)
      unprotected.push(sheet.getRange('I2'));
      unprotected.push(sheet.getRange('K2'));
      unprotected.push(sheet.getRange('B3:P3')); // Stage 1 Notes

      if (lastRow >= 12) {
        unprotected.push(sheet.getRange(`A12:B${lastRow}`)); // Status & Notes
        unprotected.push(sheet.getRange(`G12:K${lastRow}`)); // Slots, Setup, Support, Fines, Sponsor
      }

      if (lastRow >= 15) {
        unprotected.push(sheet.getRange(`B15:G${lastRow}`)); // Expenses
      }

      sheetProtection.setUnprotectedRanges(unprotected);

      unprotected.forEach(rng => {
        const rp = rng.protect().setDescription(`Editor Lock: ${name}`);
        rp.removeEditors(rp.getEditors());
        rp.addEditors(allowedEditors);
        if (rp.canDomainEdit()) rp.setDomainEdit(false);
      });
    }
  });

  SpreadsheetApp.getUi().alert(
    'AgroHeal Full Setup Complete! 🎉\n\n' +
    '1. 🏷️ DYNAMIC RATES: Both Slot Rate (I2) & Monthly Rate (K2) are active & editable.\n' +
    '2. ⚙️ POPUP DIALOG: Use "🌾 AgroHeal Admin" -> "⚙️ Edit Farm Rates" anytime.\n' +
    '3. 👑 LEAD DEV & CO-FOUNDER: Full master edit control on everything.\n' +
    '4. 👨‍💼 COORDINATORS: Locked to their assigned farms with edit rights on slots, rates & notes.\n' +
    '5. 🔒 SECURITY: Emails and audit formulas locked.'
  );
}
