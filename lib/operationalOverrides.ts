/** Unidades en uso que deben figurar operativas en el tablero. */
const FORCED_OPERATIONAL_NUMEROS = new Set([
  "9731", // NISSAN — jefe de coche se maneja en esta unidad
]);

export function isForcedOperational(numero: string): boolean {
  const n = numero?.trim();
  return Boolean(n && FORCED_OPERATIONAL_NUMEROS.has(n));
}
