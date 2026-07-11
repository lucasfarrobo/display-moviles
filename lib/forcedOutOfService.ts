/** Unidades confirmadas fuera de servicio (aunque la última fila del formulario no lo repita). */
const FORCED_OUT_OF_SERVICE_BY_PATENTE: Readonly<
  Record<string, { numero: string; motivo: string }>
> = {
  AH185CD: { numero: "114", motivo: "Inundado" },
  AG095RF: {
    numero: "15",
    motivo: "Sin batería — correa de distribución casi cortada",
  },
  AG997PT: { numero: "38", motivo: "Caja y diferencial roto" },
  AG095RJ: { numero: "16", motivo: "Chocado" },
  AF880JJ: { numero: "10", motivo: "Fuera de servicio" },
};

export function isForcedOutOfService(patente: string, numero?: string): boolean {
  return getForcedOutOfServiceMotivo(patente, numero) != null;
}

export function getForcedOutOfServiceMotivo(
  patente: string,
  numero?: string
): string | null {
  const p = patente?.trim().toUpperCase();
  if (p && FORCED_OUT_OF_SERVICE_BY_PATENTE[p]) {
    return FORCED_OUT_OF_SERVICE_BY_PATENTE[p].motivo;
  }

  const n = numero?.trim();
  if (n) {
    for (const entry of Object.values(FORCED_OUT_OF_SERVICE_BY_PATENTE)) {
      if (entry.numero === n) return entry.motivo;
    }
  }

  return null;
}
