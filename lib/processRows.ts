import type { Mobile, Novedad } from "./types";
import { parseMobileField } from "./parseMobile";
import {
  buildNovedadTexto,
  inferStatusFromText,
  mapEstadoToStatus,
  statusFromInspection,
} from "./status";
import { SHEET_CONFIG, columnIndex } from "./config";

export interface SheetRow {
  rowIndex: number;
  cells: string[];
}

function getCell(row: string[], oneBasedCol: number): string {
  if (oneBasedCol <= 0) return "";
  return row[columnIndex(oneBasedCol)]?.trim() ?? "";
}

export function parseTimestamp(raw: string): number {
  if (!raw) return 0;

  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) return direct;

  const match = raw.match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (match) {
    const [, d, m, y, hh = "0", mm = "0", ss = "0"] = match;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    return new Date(
      year,
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss)
    ).getTime();
  }

  return 0;
}

function findHeaderRowIndex(rows: SheetRow[]): number {
  const idx = rows.findIndex((r) =>
    r.cells.some((c) => /^marca temporal$/i.test(c.trim()))
  );
  return idx >= 0 ? idx : 0;
}

function detectColumnByHeader(headers: string[], keywords: string[]): number {
  const idx = headers.findIndex((h) => {
    const lower = h.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  });
  return idx >= 0 ? idx + 1 : 0;
}

function resolveColumns(headers: string[]) {
  const cfg = SHEET_CONFIG;
  return {
    timestamp: cfg.columnTimestamp,
    mobile:
      cfg.columnMobile ||
      detectColumnByHeader(headers, ["columna 6", "móvil", "movil", "dominio"]),
    estado:
      cfg.columnEstado ||
      detectColumnByHeader(headers, ["estado", "color", "semáforo", "semaforo"]),
    novedad:
      cfg.columnNovedad ||
      detectColumnByHeader(headers, [
        "observaciones generales",
        "novedad",
        "observ",
      ]),
    higieneInterior:
      cfg.columnHigieneInterior ||
      detectColumnByHeader(headers, ["higiene interior"]),
    higieneExterior:
      cfg.columnHigieneExterior ||
      detectColumnByHeader(headers, ["higiene exterior"]),
    reportadoPor:
      cfg.columnReportadoPor ||
      detectColumnByHeader(headers, ["chofer", "conductor", "reportado"]),
  };
}

function rowToNovedad(
  row: SheetRow,
  cols: ReturnType<typeof resolveColumns>
): { parsed: ReturnType<typeof parseMobileField>; novedad: Novedad } | null {
  const mobileRaw = getCell(row.cells, cols.mobile);
  const parsed = parseMobileField(mobileRaw);
  if (!parsed) return null;

  const timestampRaw = getCell(row.cells, cols.timestamp);
  const timestampMs = parseTimestamp(timestampRaw);

  const observaciones = getCell(row.cells, cols.novedad);
  const higieneInterior = getCell(row.cells, cols.higieneInterior);
  const higieneExterior = getCell(row.cells, cols.higieneExterior);
  const estadoRaw = getCell(row.cells, cols.estado);

  const novedadText = buildNovedadTexto({
    observaciones,
    higieneInterior,
    higieneExterior,
  });

  const status = estadoRaw
    ? mapEstadoToStatus(estadoRaw)
    : cols.novedad || cols.higieneInterior
      ? statusFromInspection({ observaciones, higieneInterior, higieneExterior })
      : inferStatusFromText(novedadText);

  const novedad: Novedad = {
    id: `row-${row.rowIndex}`,
    timestamp: timestampRaw || "Sin fecha",
    timestampMs,
    status,
    texto: novedadText,
    reportadoPor: getCell(row.cells, cols.reportadoPor) || undefined,
  };

  return { parsed, novedad };
}

/** Agrupa filas por móvil (patente), ordena por timestamp y arma historial. */
export function buildMobilesFromRows(rows: SheetRow[]): Mobile[] {
  if (rows.length === 0) return [];

  const headerIdx = findHeaderRowIndex(rows);
  const headers = rows[headerIdx].cells;
  const dataRows = rows.slice(headerIdx + 1);
  const cols = resolveColumns(headers);

  const byKey = new Map<
    string,
    {
      parsed: NonNullable<ReturnType<typeof parseMobileField>>;
      novedades: Novedad[];
    }
  >();

  for (const row of dataRows) {
    if (row.cells.every((c) => !c?.trim())) continue;

    const result = rowToNovedad(row, cols);
    if (!result) continue;

    const existing = byKey.get(result.parsed.key);
    if (existing) {
      existing.novedades.push(result.novedad);
      if (!existing.parsed.nombre && result.parsed.nombre) {
        existing.parsed.nombre = result.parsed.nombre;
      }
      if (!existing.parsed.patente && result.parsed.patente) {
        existing.parsed.patente = result.parsed.patente;
      }
    } else {
      byKey.set(result.parsed.key, {
        parsed: result.parsed,
        novedades: [result.novedad],
      });
    }
  }

  const mobiles: Mobile[] = [];

  for (const [key, { parsed, novedades }] of byKey) {
    const historial = [...novedades].sort((a, b) => {
      if (b.timestampMs !== a.timestampMs) {
        return b.timestampMs - a.timestampMs;
      }
      return b.id.localeCompare(a.id);
    });

    const ultima = historial[0];
    mobiles.push({
      id: key,
      numero: parsed.numero,
      nombre: parsed.nombre,
      patente: parsed.patente,
      status: ultima.status,
      ultimaActualizacion: ultima.timestamp,
      ultimaNovedad: ultima,
      historial,
      totalNovedades: historial.length,
    });
  }

  return mobiles.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function extractSpreadsheetId(urlOrId: string): string {
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
}
