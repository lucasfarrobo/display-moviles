import type { Status } from "./types";
import type { FluidReading, InspeccionVehiculo } from "./inspection";
import { applyObsFluidOverrides } from "./obsFluids";
import {
  fluidStatusFromPercent,
  isFluidOutOfServicePercent,
} from "./fluidBands";

export function mapEstadoToStatus(estadoRaw: string): Status {
  const val = estadoRaw?.toLowerCase().trim() ?? "";

  if (
    val.includes("fuera") ||
    val.includes("servicio") ||
    val.includes("rojo") ||
    val.includes("inoper") ||
    val.includes("baja") ||
    val === "malo"
  ) {
    return "outOfService";
  }

  if (
    val.includes("tener") ||
    val.includes("cuenta") ||
    val.includes("amarillo") ||
    val.includes("observ") ||
    val.includes("atención") ||
    val.includes("atencion") ||
    val.includes("precauc") ||
    val === "regular"
  ) {
    return "attention";
  }

  return "operational";
}

/** Fallas graves que mantienen rojo aunque aparezcan solo en el historial. */
export function isPermanentOutOfServiceObs(observaciones: string): boolean {
  const obs = observaciones.toLowerCase();

  if (/no\s+arranca/i.test(obs)) return true;
  if (/inund|inundado/i.test(obs)) return true;
  if (
    /falta\s+de\s+aceite\s+en\s+caja|aceite\s+(?:de\s+)?caja|aceite\s+en\s+caja/i.test(
      obs
    )
  ) {
    return true;
  }
  if (/siniestr/i.test(obs)) return true;

  return false;
}

/** Observaciones críticas en la última novedad. */
export function isOutOfServiceObs(observaciones: string): boolean {
  if (isPermanentOutOfServiceObs(observaciones)) return true;

  const obs = observaciones.toLowerCase();

  if (
    /sin\s+bater[ií]a|sin\s+batear[ií]a|no\s+tiene\s+bater[ií]a|bater[ií]a\s+(?:sin|faltante|descargada)/i.test(
      obs
    )
  ) {
    return true;
  }
  if (
    /sin\s+patente|no\s+posee\s+patente|falta\s+(?:la\s+)?patente|patente\s+(?:delantera|trasera)?\s*(?:sin|faltante)/i.test(
      obs
    )
  ) {
    return true;
  }

  return false;
}

/** Cualquier fluido < 1/4 → fuera de servicio. Hasta 1/4 inclusive → amarillo. */
export function isOutOfServiceFromInspection(
  inspeccion: InspeccionVehiculo | undefined
): boolean {
  if (!inspeccion) return false;

  const fluids = [
    inspeccion.combustible,
    inspeccion.aceite,
    inspeccion.refrigerante,
    inspeccion.liquidoFrenos,
  ];

  return fluids.some(
    (f) => f.raw?.trim() && isFluidOutOfServicePercent(f.percent)
  );
}

function statusFromFluid(reading: FluidReading): Status | null {
  if (!reading.raw?.trim()) return null;
  return fluidStatusFromPercent(reading.percent);
}

function statusFromAllFluids(inspeccion: InspeccionVehiculo): Status | null {
  const fluids = [
    inspeccion.combustible,
    inspeccion.aceite,
    inspeccion.refrigerante,
    inspeccion.liquidoFrenos,
  ];

  let attention = false;
  for (const fluid of fluids) {
    const band = statusFromFluid(fluid);
    if (band === "outOfService") return "outOfService";
    if (band === "attention") attention = true;
  }

  if (attention) return "attention";
  return null;
}

/** Baliza fallida o fluidos en 1/4–49 % → atención en panel. Luces bajas → amarillo en tablero. */
export function isAttentionFromInspection(
  inspeccion: InspeccionVehiculo | undefined
): boolean {
  if (!inspeccion) return false;

  if (!inspeccion.luces.bajas.ok) return true;
  if (!inspeccion.luces.baliza.ok) return true;

  return statusFromAllFluids(inspeccion) === "attention";
}

export function isAttentionFromLucesBajas(
  inspeccion: InspeccionVehiculo | undefined
): boolean {
  return Boolean(inspeccion && !inspeccion.luces.bajas.ok);
}

export function buildNovedadTexto(observaciones: string): string {
  const obs = observaciones?.trim();
  if (obs && !isSinNovedadTexto(obs)) return obs;
  return "Sin novedades. Inspección conforme.";
}

export function stripHigieneLines(texto: string): string {
  return (texto ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^higiene\s+(interior|exterior)\s*:/i.test(l))
    .join("\n")
    .trim();
}

export function isHigieneOnlyTexto(texto: string): boolean {
  const trimmed = (texto ?? "").trim();
  if (!trimmed) return false;
  const withoutHigiene = stripHigieneLines(trimmed);
  if (withoutHigiene) return false;
  return /higiene\s+(interior|exterior)/i.test(trimmed);
}

export function isSinNovedadTexto(texto: string): boolean {
  const t = (texto ?? "").trim().toLowerCase();
  if (!t) return true;
  if (/sin\s+novedad/i.test(t)) return true;
  if (/^inspecci[oó]n conforme\.?$/i.test(t)) return true;
  if (/^sin novedades?\.\s*inspecci[oó]n conforme\.?$/i.test(t)) return true;
  return false;
}

/** Parte/accesorio fuera de servicio — no implica que el móvil completo lo esté. */
function isParteFueraDeServicioEnNovedad(obs: string): boolean {
  return /(?:baliza|botonera|tecla|rueda(?:\s+de\s+auxilio)?|auxilio|estuche|bot[oó]n(?:era)?|sirena|señal\s+sonora|llave\s+de|matafuego|óptica|optica)\b[^.;\n]{0,50}\bfuera\s+de\s+servicio\b/i.test(
    obs
  );
}

/**
 * El móvil figura explícitamente fuera de servicio en la novedad
 * (no accesorios sueltos tipo «botonera fuera de servicio»).
 */
export function isVehiculoFueraDeServicioEnNovedad(texto: string): boolean {
  const obs = stripHigieneLines(texto ?? "").trim().toLowerCase();
  if (!obs || isSinNovedadTexto(obs)) return false;
  if (isParteFueraDeServicioEnNovedad(obs)) return false;

  if (/\b(?:m[oó]vil|unidad|veh[ií]culo|interno)\b[^.;\n]{0,40}\bfuera\s+de\s+servicio\b/i.test(obs)) {
    return true;
  }
  if (/\bqueda\s+fuera\s+de\s+servicio\b/i.test(obs)) return true;
  if (/\b(?:se\s+encuentra|est[aá])\s+fuera\s+de\s+servicio\b/i.test(obs)) return true;
  if (/^fuera\s+de\s+servicio\b/i.test(obs)) return true;
  if (/\bfuera\s+de\s+servicio\s*\.?\s*$/i.test(obs)) return true;
  if (/\bfuera\s+servicio\b/i.test(obs)) return true;
  if (/\bfds\b/i.test(obs)) return true;

  return false;
}

export function resolveNovedadStatus(
  texto: string,
  observacionesRaw?: string
): Status {
  const candidates = [observacionesRaw, texto].filter(Boolean) as string[];
  for (const t of candidates) {
    if (isVehiculoFueraDeServicioEnNovedad(t)) return "outOfService";
  }
  return "operational";
}

export function shouldHideFromHistorial(texto: string): boolean {
  return isSinNovedadTexto(texto) || isHigieneOnlyTexto(texto);
}

/** Tablero: rojo si FdS en novedad; amarillo si luces bajas quemadas; si no, verde. */
export function resolveMobileBoardStatus(
  novedades: Array<{
    texto: string;
    status?: Status;
    inspeccion?: InspeccionVehiculo;
  }>
): Status {
  if (novedades.length === 0) return "operational";
  const ultima = novedades[0];
  if (ultima.status === "outOfService") return "outOfService";
  if (isVehiculoFueraDeServicioEnNovedad(ultima.texto)) return "outOfService";

  const obs = stripHigieneLines(ultima.texto ?? "");
  const insp = applyObsFluidOverrides(ultima.inspeccion, obs);
  if (isAttentionFromLucesBajas(insp)) return "attention";

  return "operational";
}

export function cleanNovedadTexto(texto: string): string {
  const safe = texto ?? "";
  const cleaned = stripHigieneLines(safe);
  return cleaned || safe;
}
