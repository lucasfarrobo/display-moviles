/** Unidades confirmadas fuera de servicio (aunque la última fila no lo repita). */
const FORCED_OUT_OF_SERVICE_PATENTES = new Set([
  "AH185CD", // INT 114 — no arranca / inundado
  "AG997PT", // INT 38 — falta aceite en caja
  "AG095RJ", // INT 16 — siniestrado
  "AG095RF", // INT 15 — no arranca
  "AH054XN", // INT 70 — sin batería
]);

export function isForcedOutOfService(patente: string): boolean {
  const p = patente?.trim().toUpperCase();
  if (!p) return false;
  return FORCED_OUT_OF_SERVICE_PATENTES.has(p);
}
