/**
 * AI Lead Intelligence — File Parser
 * Safely parses XLSX, XLS, and CSV files using ExcelJS.
 */

import ExcelJS from 'exceljs';
import { detectSchemaAndMapRows, MappedRow } from './schemaDetector.ts';

export interface ParseResult {
  sheetName: string;
  totalRawRows: number;
  detectedColumns: {
    nameCol: string | null;
    phoneCol: string | null;
    emailCol: string | null;
    locationCol: string | null;
    inquiryCol: string | null;
    sourceCol: string | null;
    unmappedCols: string[];
  };
  mappedRows: MappedRow[];
  rawRecords: Record<string, any>[];
}

export async function parseSpreadsheetBuffer(
  buffer: Buffer,
  fileName: string
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  const isCsv = fileName.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const csvString = buffer.toString('utf-8');
    // Using ExcelJS csv reader via stream buffer
    const { Readable } = await import('stream');
    const stream = Readable.from([csvString]);
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.load(buffer as any);
  }

  // Get first worksheet
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('The uploaded workbook contains no readable sheets.');
  }

  const rawRecords: Record<string, any>[] = [];
  const headerMap = new Map<number, string>();

  // Determine header row (row 1 or first non-empty row)
  let headerRowIndex = 1;
  for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    const nonBlankCount = row.actualCellCount;
    if (nonBlankCount > 1) {
      headerRowIndex = r;
      break;
    }
  }

  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    let headerText = '';
    if (typeof cell.value === 'object' && cell.value !== null && 'text' in cell.value) {
      headerText = String((cell.value as any).text);
    } else {
      headerText = String(cell.value ?? '');
    }
    headerText = headerText.trim();
    if (headerText) {
      headerMap.set(colNumber, headerText);
    }
  });

  if (headerMap.size === 0) {
    throw new Error('No column headers could be detected in the spreadsheet.');
  }

  // Read data rows
  for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    // Check if entire row is empty
    let hasAnyData = false;
    const rowObj: Record<string, any> = {};

    headerMap.forEach((headerName, colNumber) => {
      const cell = row.getCell(colNumber);
      let val: any = cell.value;
      if (typeof val === 'object' && val !== null) {
        if ('text' in val) {
          val = val.text;
        } else if ('result' in val) {
          val = val.result;
        } else if ('richText' in val && Array.isArray(val.richText)) {
          val = val.richText.map((rt: any) => rt.text).join('');
        }
      }
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        hasAnyData = true;
        rowObj[headerName] = typeof val === 'string' ? val.trim() : val;
      } else {
        rowObj[headerName] = null;
      }
    });

    if (hasAnyData) {
      rawRecords.push(rowObj);
    }
  }

  const { detectedColumns, mappedRows } = detectSchemaAndMapRows(rawRecords);

  return {
    sheetName: worksheet.name || 'Sheet1',
    totalRawRows: rawRecords.length,
    detectedColumns,
    mappedRows,
    rawRecords,
  };
}
