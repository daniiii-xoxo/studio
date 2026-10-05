import * as XLSX from "xlsx";

export interface ExcelSheetData {
  name: string;
  data: (string | number | boolean | null | undefined)[][];
  colWidths?: number[];
}

/**
 * Exports data to a formatted multi-sheet Excel file (.xlsx) with clean column widths.
 */
export function exportToExcel(
  filename: string,
  sheets: ExcelSheetData[]
) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.data);

    if (sheet.colWidths && sheet.colWidths.length > 0) {
      ws["!cols"] = sheet.colWidths.map((wch) => ({ wch }));
    } else {
      // Auto-calculate column widths from data
      const maxColCounts = Math.max(...sheet.data.map((r) => r.length), 0);
      const colWidths: { wch: number }[] = [];

      for (let c = 0; c < maxColCounts; c++) {
        let maxLen = 10;
        for (const row of sheet.data) {
          const val = row[c];
          if (val != null) {
            const str = String(val);
            if (str.length > maxLen) {
              maxLen = Math.min(str.length, 50);
            }
          }
        }
        colWidths.push({ wch: maxLen + 3 });
      }
      ws["!cols"] = colWidths;
    }

    // Sheet name in Excel must be <= 31 chars and cannot contain certain chars
    const safeSheetName = (sheet.name || "Sheet1")
      .replace(/[\\/*?:[\]]/g, "_")
      .slice(0, 31);

    XLSX.utils.book_append_sheet(workbook, ws, safeSheetName);
  });

  const finalName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}
