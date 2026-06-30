import { google } from "googleapis";
import type { Mobile, MobilesResponse } from "./types";
import { MOCK_MOBILES } from "./types";
import {
  buildMobilesFromRows,
  extractSpreadsheetId,
  type SheetRow,
} from "./processRows";
import { SHEET_CONFIG } from "./config";

function toSheetRows(values: string[][]): SheetRow[] {
  return values.map((cells, idx) => ({
    rowIndex: idx + 1,
    cells: cells.map((c) => String(c ?? "")),
  }));
}

async function fetchPublicCsv(sheetId: string): Promise<string[][]> {
  const gid = SHEET_CONFIG.sheetGid;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Export CSV falló (${res.status})`);
  }

  const csv = await res.text();
  return parseCsv(csv);
}

/** Parser CSV con soporte de campos multilínea entre comillas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r") i++;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim())) rows.push(row);
  }

  return rows;
}

async function fetchViaServiceAccount(sheetId: string): Promise<string[][]> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT no configurado");
  }

  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const range = SHEET_CONFIG.sheetName
    ? `${SHEET_CONFIG.sheetName}!A:AL`
    : "A:AL";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  return (response.data.values as string[][]) ?? [];
}

export async function getMobilesFromSheets(): Promise<MobilesResponse> {
  const sheetIdRaw = SHEET_CONFIG.sheetId;
  const sheetId = sheetIdRaw ? extractSpreadsheetId(sheetIdRaw) : "";
  const usePublic = process.env.GOOGLE_SHEETS_PUBLIC !== "false";
  const hasServiceAccount = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT);

  if (!sheetId) {
    console.warn("[sheets] Sin GOOGLE_SHEETS_ID → datos de prueba");
    return {
      mobiles: MOCK_MOBILES,
      updatedAt: new Date().toISOString(),
      source: "mock",
    };
  }

  try {
    let values: string[][];

    if (hasServiceAccount && !usePublic) {
      values = await fetchViaServiceAccount(sheetId);
    } else {
      values = await fetchPublicCsv(sheetId);
    }

    const rows = toSheetRows(values);
    const mobiles = buildMobilesFromRows(rows);

    if (mobiles.length === 0) {
      console.warn("[sheets] Sin móviles parseados → mock");
      return {
        mobiles: MOCK_MOBILES,
        updatedAt: new Date().toISOString(),
        source: "mock",
      };
    }

    return {
      mobiles,
      updatedAt: new Date().toISOString(),
      source: "sheets",
    };
  } catch (err) {
    console.error("[sheets] Error:", err);
    return {
      mobiles: MOCK_MOBILES,
      updatedAt: new Date().toISOString(),
      source: "mock",
    };
  }
}

export async function getMobileById(id: string): Promise<Mobile | null> {
  const { mobiles } = await getMobilesFromSheets();
  return mobiles.find((m) => m.id === id) ?? null;
}
