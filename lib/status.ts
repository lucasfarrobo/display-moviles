import type { Status } from "./types";

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

export function inferStatusFromText(text: string): Status {
  return mapEstadoToStatus(text);
}

/** Estado según inspección vehicular del formulario real. */
export function statusFromInspection(input: {
  observaciones: string;
  higieneInterior: string;
  higieneExterior: string;
}): Status {
  const obs = input.observaciones?.toLowerCase().trim() ?? "";
  const hi = input.higieneInterior?.toUpperCase().trim() ?? "";
  const he = input.higieneExterior?.toUpperCase().trim() ?? "";

  const criticalObs =
    /inmoviliz|fuera de servicio|no oper|no circula|gravedad|frenos|motor|rotura|partido|roto|no arranca|taller|desinflado|falta comando|sin auxilio|no tiene auxilio|baja/i;

  if (criticalObs.test(obs)) return "outOfService";
  if (hi === "MALO" || he === "MALO") return "outOfService";

  if (hi === "REGULAR" || he === "REGULAR" || obs.length > 20) {
    return "attention";
  }

  if (obs.length > 0) return "attention";

  return "operational";
}

export function buildNovedadTexto(input: {
  observaciones: string;
  higieneInterior: string;
  higieneExterior: string;
}): string {
  const parts: string[] = [];

  const obs = input.observaciones?.trim();
  if (obs) parts.push(obs);

  const hi = input.higieneInterior?.trim();
  const he = input.higieneExterior?.trim();

  if (hi && hi.toUpperCase() !== "BUENO") {
    parts.push(`Higiene interior: ${hi}`);
  }
  if (he && he.toUpperCase() !== "BUENO") {
    parts.push(`Higiene exterior: ${he}`);
  }

  if (parts.length === 0) {
    return "Sin novedades. Inspección conforme.";
  }

  return parts.join("\n");
}
