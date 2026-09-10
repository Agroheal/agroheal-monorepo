import * as XLSX from "xlsx";

export interface ExcelSheetDefinition {
  sheetName: string;
  data: Record<string, any>[];
  headers?: Record<string, string>;
  customWidths?: Record<string, number>;
}

export interface ExportWorkbookOptions {
  filename: string;
  sheets: ExcelSheetDefinition[];
}

/**
 * Sanitizes a string for use as an Excel worksheet tab name.
 * Excel enforces a 31-character limit and forbids : \ / ? * [ ]
 */
export function sanitizeSheetName(name: string, fallback = "Sheet1"): string {
  if (!name || !name.trim()) return fallback;
  const sanitized = name.replace(/[:\\/?*\[\]]/g, " ").trim();
  return (sanitized || fallback).substring(0, 31);
}

/**
 * Calculates optimal column widths based on maximum string length of headers and data cells.
 */
function calculateColumnWidths(data: Record<string, any>[], customWidths?: Record<string, number>) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);

  return keys.map((key) => {
    if (customWidths && customWidths[key]) {
      return { wch: customWidths[key] };
    }

    let maxLength = key.length;
    for (let i = 0; i < Math.min(data.length, 500); i++) {
      const val = data[i][key];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        if (strVal.length > maxLength) {
          maxLength = strVal.length;
        }
      }
    }

    // Give a little padding, enforce reasonable minimum and maximum
    const colWidth = Math.min(Math.max(maxLength + 3, 10), 60);
    return { wch: colWidth };
  });
}

/**
 * Exports one or more datasets into a formatted Microsoft Excel (.xlsx) file
 * and triggers a native browser download.
 */
export function exportToExcel({ filename, sheets }: ExportWorkbookOptions): void {
  try {
    const wb = XLSX.utils.book_new();

    const usedNames = new Set<string>();

    for (const sheetDef of sheets) {
      let baseName = sanitizeSheetName(sheetDef.sheetName);
      let uniqueName = baseName;
      let counter = 2;
      while (usedNames.has(uniqueName.toLowerCase())) {
        const suffix = ` (${counter})`;
        uniqueName = `${baseName.substring(0, 31 - suffix.length)}${suffix}`;
        counter++;
      }
      usedNames.add(uniqueName.toLowerCase());

      let rows = sheetDef.data;
      if (sheetDef.headers && rows.length > 0) {
        // Remap keys to human-friendly header titles if provided
        const headerMap = sheetDef.headers;
        rows = rows.map((row) => {
          const mappedRow: Record<string, any> = {};
          for (const [key, val] of Object.entries(row)) {
            const headerTitle = headerMap[key] || key;
            mappedRow[headerTitle] = val;
          }
          return mappedRow;
        });
      }

      // If data is empty, supply an informative empty row so sheet renders cleanly
      if (!rows || rows.length === 0) {
        rows = [{ "Status": "No records available for export" }];
      }

      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto-size columns
      ws["!cols"] = calculateColumnWidths(rows, sheetDef.customWidths);

      XLSX.utils.book_append_sheet(wb, ws, uniqueName);
    }

    const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, safeFilename);
  } catch (error) {
    console.error("Failed to generate Excel export:", error);
    throw error;
  }
}
