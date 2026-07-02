import { google } from "googleapis";
import type { Mobile, MobilesResponse } from "./types";
import { MOCK_MOBILES } from "./types";
import {
  buildMobilesFromRows,
  extractSpreadsheetId,
  type SheetRow,
} from "./processRows";
import { SHEET_CONFIG } from "./config";
import { parseCsv } from "./csv";

function trimRowCells(cells: string[]): string[] {
  const max = SHEET_CONFIG.maxColumn;
  return cells.slice(0, max);
}

function toSheetRows(values: string[][]): SheetRow[] {
  return values.map((cells, idx) => ({
    rowIndex: idx + 1,
    cells: trimRowCells(cells.map((c) => String(c ?? ""))),
  }));
}

async function fetchPublicCsv(sheetId: string): Promise<string[][]> {
  const gid = SHEET_CONFIG.sheetGid;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Export CSV falló (${res.status})`);
  }

  return parseCsv(await res.text());
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
    ? `${SHEET_CONFIG.sheetName}!A:Z`
    : "A:Z";

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
    const values =
      hasServiceAccount && !usePublic
        ? await fetchViaServiceAccount(sheetId)
        : await fetchPublicCsv(sheetId);

    const mobiles = buildMobilesFromRows(toSheetRows(values));

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
