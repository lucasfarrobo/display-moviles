export interface ParsedMobile {
  numero: string;
  nombre: string;
  patente: string;
  key: string;
}

/**
 * Parsea el campo "Columna 6" del formulario de inspección.
 */
export function parseMobileField(raw: string): ParsedMobile | null {
  const text = raw?.trim();
  if (!text) return null;

  const threePart = text.match(
    /^(.+?)\s*-\s*(\d{2,5})\s*-\s*([A-Z0-9]{6,8})$/i
  );
  if (threePart) {
    const [, marca, numero, patente] = threePart;
    return buildParsed(numero, marca.trim(), patente.toUpperCase());
  }

  const patente = extractPatente(text);
  const numero = extractNumero(text);
  const nombre = extractNombre(text, patente, numero);

  if (!patente && !numero) {
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return buildParsed(text, text, "", slug);
  }

  return buildParsed(numero || patente, nombre || text, patente);
}

function extractPatente(text: string): string {
  const dominio = text.match(/DOMINIO\s*([A-Z0-9]{6,8})/i);
  if (dominio) return dominio[1].toUpperCase();

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
  return /^[A-Z]{2,3}\d{3}[A-Z]{0,3}$/.test(n) || /^[A-Z0-9]{6,8}$/.test(n);
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
