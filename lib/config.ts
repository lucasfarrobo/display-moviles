/** Configuración del Google Sheet (1-based, como en Excel/Sheets). */
export const SHEET_CONFIG = {
  sheetId:
    process.env.GOOGLE_SHEETS_ID ??
    process.env.GOOGLE_SHEETS_URL ??
    "1261kGsRxL0xbsKI2vxD_dDelQwZpmGI27ecBrbs5G8M",

  /** GID de la pestaña (desde la URL: gid=...) */
  sheetGid: process.env.GOOGLE_SHEET_GID ?? "206598462",

  sheetName: process.env.GOOGLE_SHEET_NAME ?? "",

  columnTimestamp: Number(process.env.SHEET_COL_TIMESTAMP ?? 1),
  columnFecha: Number(process.env.SHEET_COL_FECHA ?? 5),
  columnHora: Number(process.env.SHEET_COL_HORA ?? 6),
  /** Campo del formulario "Columna 6" → columna G (7) del sheet */
  columnMobile: Number(process.env.SHEET_COL_MOBILE ?? 7),
  columnReportadoPor: Number(process.env.SHEET_COL_REPORTADO_POR ?? 4),
  columnJefeDeCoche: Number(process.env.SHEET_COL_JEFE_COCHE ?? 3),
  columnNovedad: Number(process.env.SHEET_COL_NOVEDAD ?? 22),
  columnHigieneInterior: Number(process.env.SHEET_COL_HIGIENE_INT ?? 21),
  columnHigieneExterior: Number(process.env.SHEET_COL_HIGIENE_EXT ?? 23),

  columnCombustible: Number(process.env.SHEET_COL_COMBUSTIBLE ?? 9),
  columnLucesAltas: Number(process.env.SHEET_COL_LUCES_ALTAS ?? 10),
  columnLucesBajas: Number(process.env.SHEET_COL_LUCES_BAJAS ?? 11),
  columnLucesBaliza: Number(process.env.SHEET_COL_LUCES_BALIZA ?? 12),
  columnAceite: Number(process.env.SHEET_COL_ACEITE ?? 13),
  columnRefrigerante: Number(process.env.SHEET_COL_REFRIGERANTE ?? 14),
  columnLiquidoFrenos: Number(process.env.SHEET_COL_LIQUIDO_FRENOS ?? 15),

  /** Sin columna de estado explícita en este formulario */
  columnEstado: Number(process.env.SHEET_COL_ESTADO ?? 0),
} as const;

export function columnIndex(oneBased: number): number {
  return oneBased - 1;
}
