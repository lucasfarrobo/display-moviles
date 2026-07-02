import type { Mobile, Novedad } from "./types";
import { parseMobileField, type ParsedMobile } from "./parseMobile";
import {
  buildNovedadTexto,
  cleanNovedadTexto,
  mapEstadoToStatus,
  resolveMobileStatus,
  shouldHideFromHistorial,
} from "./status";
import { SHEET_CONFIG, columnIndex } from "./config";
import { parseInspeccion } from "./inspection";
import { resolveRowTimestamp } from "./timestamp";

export interface SheetRow {
  rowIndex: number;
  cells: string[];
}

function getCell(row: string[], oneBasedCol: number): string {
  if (oneBasedCol <= 0) return "";
  return row[columnIndex(oneBasedCol)]?.trim() ?? "";
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
    fecha: cfg.columnFecha,
    hora: cfg.columnHora,
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
    jefeDeCoche:
      cfg.columnJefeDeCoche ||
      detectColumnByHeader(headers, ["jefe de coche", "jefe"]),
    combustible:
      cfg.columnCombustible ||
      detectColumnByHeader(headers, ["combustible"]),
    lucesAltas:
      cfg.columnLucesAltas ||
      detectColumnByHeader(headers, ["altas"]),
    lucesBajas:
      cfg.columnLucesBajas ||
      detectColumnByHeader(headers, ["bajas"]),
    lucesBaliza:
      cfg.columnLucesBaliza ||
      detectColumnByHeader(headers, ["baliza"]),
    aceite:
      cfg.columnAceite ||
      detectColumnByHeader(headers, ["aceite"]),
    refrigerante:
      cfg.columnRefrigerante ||
      detectColumnByHeader(headers, ["refrigerante"]),
    liquidoFrenos:
      cfg.columnLiquidoFrenos ||
      detectColumnByHeader(headers, ["frenos"]),
  };
}

function rowToNovedad(
  row: SheetRow,
  cols: ReturnType<typeof resolveColumns>
): { parsed: ParsedMobile; novedad: Novedad } | null {
  const mobileRaw = getCell(row.cells, cols.mobile);
  const parsed = parseMobileField(mobileRaw);
  if (!parsed) return null;

  const timestampRaw = getCell(row.cells, cols.timestamp);
  const fechaRaw = getCell(row.cells, cols.fecha);
  const horaRaw = getCell(row.cells, cols.hora);
  const { timestampMs, timestamp } = resolveRowTimestamp({
    marcaTemporal: timestampRaw,
    fecha: fechaRaw,
    hora: horaRaw,
  });

  const observaciones = getCell(row.cells, cols.novedad);
  const estadoRaw = getCell(row.cells, cols.estado);

  const inspeccion = parseInspeccion({
    combustible: getCell(row.cells, cols.combustible),
    aceite: getCell(row.cells, cols.aceite),
    refrigerante: getCell(row.cells, cols.refrigerante),
    liquidoFrenos: getCell(row.cells, cols.liquidoFrenos),
    lucesAltas: getCell(row.cells, cols.lucesAltas),
    lucesBajas: getCell(row.cells, cols.lucesBajas),
    lucesBaliza: getCell(row.cells, cols.lucesBaliza),
  });

  const novedadText = buildNovedadTexto(observaciones);

  const status = estadoRaw
    ? mapEstadoToStatus(estadoRaw)
    : resolveMobileStatus(inspeccion, observaciones);

  const novedad: Novedad = {
    id: `row-${row.rowIndex}`,
    timestamp,
    timestampMs,
    status,
    texto: novedadText,
    jefeDeCoche: getCell(row.cells, cols.jefeDeCoche) || undefined,
    reportadoPor: getCell(row.cells, cols.reportadoPor) || undefined,
    inspeccion,
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
      parsed: ParsedMobile;
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

  for (const [key, { parsed, novedades }] of Array.from(byKey.entries())) {
    const sorted = [...novedades].sort((a, b) => {
      if (b.timestampMs !== a.timestampMs) {
        return b.timestampMs - a.timestampMs;
      }
      const rowA = Number(a.id.replace("row-", "")) || 0;
      const rowB = Number(b.id.replace("row-", "")) || 0;
      return rowB - rowA;
    });

    const ultima = sorted[0];
    const historial = sorted
      .map((n) => ({ ...n, texto: cleanNovedadTexto(n.texto) }))
      .filter((n) => !shouldHideFromHistorial(n.texto) && n.texto.trim());

    const mobileStatus = resolveMobileStatus(
      ultima.inspeccion,
      ultima.texto
    );

    mobiles.push({
      id: key,
      numero: parsed.numero,
      nombre: parsed.nombre,
      patente: parsed.patente,
      status: mobileStatus,
      ultimaActualizacion: ultima.timestamp,
      ultimaNovedad: ultima,
      historial,
      totalNovedades: historial.length,
      inspeccion: ultima.inspeccion,
      jefeDeCoche: ultima.jefeDeCoche,
      chofer: ultima.reportadoPor,
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
