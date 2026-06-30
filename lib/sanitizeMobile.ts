import type { Mobile } from "./types";
import { isSinNovedadTexto } from "./status";

/** Quita del historial entradas sin observación real. */
export function sanitizeMobileHistorial(mobile: Mobile): Mobile {
  const historial = mobile.historial.filter((n) => !isSinNovedadTexto(n.texto));
  return {
    ...mobile,
    historial,
    totalNovedades: historial.length,
  };
}

export function sanitizeMobiles(mobiles: Mobile[]): Mobile[] {
  return mobiles.map(sanitizeMobileHistorial);
}
