import type { Mobile, Novedad } from "./types";
import {
  cleanNovedadTexto,
  shouldHideFromHistorial,
} from "./status";

function cleanNovedad(n: Novedad): Novedad {
  return { ...n, texto: cleanNovedadTexto(n.texto) };
}

/** Quita del historial entradas sin observación real o solo higiene. */
export function sanitizeMobileHistorial(mobile: Mobile): Mobile {
  const historial = mobile.historial
    .map(cleanNovedad)
    .filter((n) => !shouldHideFromHistorial(n.texto) && n.texto.trim());

  return {
    ...mobile,
    historial,
    totalNovedades: historial.length,
  };
}

export function sanitizeMobiles(mobiles: Mobile[]): Mobile[] {
  return mobiles.map(sanitizeMobileHistorial);
}
