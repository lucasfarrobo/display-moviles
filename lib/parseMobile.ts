export interface ParsedMobile {
  numero: string;
  nombre: string;
  patente: string;
  key: string;
}

const GENERIC_MOBILE =
  /movil\s+generico|m[oó]vil\s+gen[eé]rico|generico\s*\(\s*\)|^prestamo\b.*generico/i;

/** Opción placeholder del formulario — no es una unidad real. */
export function isGenericMobileField(raw: string): boolean {
  const text = raw?.trim() ?? "";
  if (!text) return true;
  return GENERIC_MOBILE.test(text);
}

/**
 * Parsea el campo "Columna 6" del formulario de inspección.
 * Devuelve null si el valor es genérico o no identifica un móvil real.
 */
export function parseMobileField(raw: string): ParsedMobile | null {
  const text = raw?.trim();
  if (!text || isGenericMobileField(text)) return null;

  const threePart = text.match(
    /^(.+?)\s*-\s*(\d{2,5})\s*-\s*([A-Z0-9]{6,8})$/i
  );
  if (threePart) {
    const [, marca, numero, patente] = threePart;
    if (!looksLikePatente(patente)) return null;
    return buildParsed(numero, marca.trim(), patente.toUpperCase());
  }

  const patente = extractPatente(text);
  const numero = extractNumero(text);
  const nombre = extractNombre(text, patente, numero);

  if (!patente && !numero) return null;

  if (patente && !looksLikePatente(patente)) return null;

  return buildParsed(numero || patente, nombre || text, patente);
}

function extractPatente(text: string): string {
  const dominio = text.match(/DOMINIO\s*([A-Z0-9]{6,8})/i);
  if (dominio && looksLikePatente(dominio[1])) {
    return dominio[1].toUpperCase();
  }

  const dashPatente = text.match(/-\s*([A-Z]{2,3}\d{3}[A-Z]{0,3})\s*$/i);
  if (dashPatente && looksLikePatente(dashPatente[1])) {
    return dashPatente[1].toUpperCase();
  }

  const parts = text.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].replace(/\s/g, "").toUpperCase();
    if (looksLikePatente(last)) return last;
  }

  const tokens = text.split(/\s+/);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i].replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (looksLikePatente(t)) return t;
  }

  return "";
}

function extractNumero(text: string): string {
  const intMatch = text.match(/\bINT\s*-?\s*(\d{1,5})\b/i);
  if (intMatch) return intMatch[1];

  const parts = text.split(/\s*-\s*/).map((p) => p.trim());
  for (const part of parts) {
    if (/^\d{2,5}$/.test(part)) return part;
  }

  const anyNum = text.match(/\b(\d{2,5})\b/);
  return anyNum?.[1] ?? "";
}

function extractNombre(text: string, patente: string, numero: string): string {
  let nombre = text
    .replace(/-?\s*DOMINIO\s*[A-Z0-9]+/gi, "")
    .replace(/\s*-\s*[A-Z]{2,3}\d{3}[A-Z]{0,3}\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (patente) {
    nombre = nombre.replace(new RegExp(patente, "i"), "").trim();
  }

  if (numero) {
    nombre = nombre
      .replace(new RegExp(`\\bINT\\s*-?\\s*${numero}\\b`, "i"), "")
      .replace(new RegExp(`\\b${numero}\\b`), "")
      .replace(/\s*-\s*-\s*/g, " - ")
      .replace(/^[\s-]+|[\s-]+$/g, "")
      .trim();
  }

  return nombre.replace(/\s*-\s*$/, "").replace(/^\s*-\s*/, "").trim();
}

function looksLikePatente(value: string): boolean {
  const n = value.replace(/\s/g, "").toUpperCase();
  if (/^[A-Z]{2,3}\d{3}[A-Z]{0,3}$/.test(n)) return true;
  if (/^[A-Z0-9]{6,8}$/.test(n) && /\d/.test(n)) return true;
  return false;
}

function buildParsed(
  numero: string,
  nombre: string,
  patente: string,
  keyOverride?: string
): ParsedMobile {
  const cleanPatente = patente.trim().toUpperCase();
  const cleanNumero = numero.trim();
  const key =
    keyOverride ||
    cleanPatente ||
    cleanNumero.toLowerCase().replace(/\s+/g, "-");

  return {
    numero: cleanNumero,
    nombre: nombre.trim(),
    patente: cleanPatente,
    key,
  };
}
