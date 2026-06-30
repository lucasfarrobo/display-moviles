import type { Status } from "./types";
import type { InspeccionVehiculo } from "./inspection";

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

const CRITICAL_OBS =
  /inmoviliz|fuera de servicio|no oper|no circula|gravedad|frenos|motor|rotura|partido|roto|no arranca|taller|desinflado|falta comando|sin auxilio|no tiene auxilio|baja/i;

const STEERING_OBS =
  /direcci[oó]n|volante|cremallera|espanol|alineaci[oó]n|tren delantero|fuga de direcci/i;

export function hasSteeringIssue(observaciones: string): boolean {
  return STEERING_OBS.test(observaciones.toLowerCase());
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

function statusFromFluids(inspeccion: InspeccionVehiculo): Status | null {
  const fluids = [
    inspeccion.combustible,
    inspeccion.aceite,
    inspeccion.refrigerante,
    inspeccion.liquidoFrenos,
  ];

  if (fluids.some((f) => f.critical || f.level === "low")) {
    return "outOfService";
  }
  if (fluids.some((f) => f.level === "medium")) {
    return "attention";
  }
  return null;
}

/** Estado del tablero según fluidos, observaciones y reglas de negocio. */
export function resolveMobileStatus(
  inspeccion: InspeccionVehiculo | undefined,
  observaciones: string
): Status {
  const obs = stripHigieneLines(observaciones?.trim() ?? "");

  if (inspeccion) {
    const fluidStatus = statusFromFluids(inspeccion);
    if (fluidStatus === "outOfService") return "outOfService";
  }

  if (CRITICAL_OBS.test(obs)) return "outOfService";

  if (hasSteeringIssue(obs)) return "attention";

  if (inspeccion) {
    const fluidStatus = statusFromFluids(inspeccion);
    if (fluidStatus === "attention") return "attention";
  }

  if (obs && !isSinNovedadTexto(obs)) return "attention";

  return "operational";
}

export function cleanNovedadTexto(texto: string): string {
  const safe = texto ?? "";
  const cleaned = stripHigieneLines(safe);
  return cleaned || safe;
}
