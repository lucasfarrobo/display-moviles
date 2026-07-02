import type { Status } from "./types";
import type { FluidReading, InspeccionVehiculo } from "./inspection";

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

/** Fuera de servicio solo por estas causas en observaciones. */
export function isOutOfServiceObs(observaciones: string): boolean {
  const obs = observaciones.toLowerCase();

  if (/no\s+arranca/i.test(obs)) return true;
  if (/falta\s+de\s+aceite\s+en\s+caja|aceite\s+(?:de\s+)?caja|aceite\s+en\s+caja/i.test(obs)) {
    return true;
  }
  if (/siniestr/i.test(obs)) return true;
  if (/sin\s+bater[ií]a|no\s+tiene\s+bater[ií]a|bater[ií]a\s+(?:sin|faltante|descargada)/i.test(obs)) {
    return true;
  }
  if (/sin\s+patente|no\s+posee\s+patente|falta\s+(?:la\s+)?patente|patente\s+(?:delantera|trasera)?\s*(?:sin|faltante)/i.test(obs)) {
    return true;
  }

  return false;
}

/** Aceite, refrigerante y líq. de frenos: 1/2=OK, entre 1/2 y 1/4=amarillo, ≤1/4=rojo. */
function statusFromMotorFluid(reading: FluidReading): Status | null {
  if (!reading.raw?.trim()) return null;
  if (reading.percent <= 25) return "outOfService";
  if (reading.percent > 25 && reading.percent < 50) return "attention";
  return null;
}

function statusFromMotorFluids(inspeccion: InspeccionVehiculo): Status | null {
  const fluids = [
    inspeccion.aceite,
    inspeccion.refrigerante,
    inspeccion.liquidoFrenos,
  ];

  let attention = false;
  for (const fluid of fluids) {
    const band = statusFromMotorFluid(fluid);
    if (band === "outOfService") return "outOfService";
    if (band === "attention") attention = true;
  }

  if (attention) return "attention";
  if (!inspeccion.luces.bajas.ok) return "attention";

  return null;
}

/** A tener en cuenta por inspección (fluidos en banda media o luces bajas). */
export function isAttentionFromInspection(
  inspeccion: InspeccionVehiculo | undefined
): boolean {
  if (!inspeccion) return false;
  const band = statusFromMotorFluids(inspeccion);
  return band === "attention";
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

export function shouldHideFromHistorial(texto: string): boolean {
  return isSinNovedadTexto(texto) || isHigieneOnlyTexto(texto);
}

/** Estado del tablero según reglas de negocio actuales. */
export function resolveMobileStatus(
  inspeccion: InspeccionVehiculo | undefined,
  observaciones: string
): Status {
  const obs = stripHigieneLines(observaciones?.trim() ?? "");

  if (isOutOfServiceObs(obs)) return "outOfService";

  if (inspeccion) {
    const fluidStatus = statusFromMotorFluids(inspeccion);
    if (fluidStatus === "outOfService") return "outOfService";
    if (fluidStatus === "attention") return "attention";
  }

  return "operational";
}

export function cleanNovedadTexto(texto: string): string {
  const safe = texto ?? "";
  const cleaned = stripHigieneLines(safe);
  return cleaned || safe;
}
