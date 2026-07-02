import type { FluidReading, InspeccionVehiculo } from "./inspection";
import { FLUID_QUARTER_PERCENT } from "./fluidBands";

/** Por debajo de 1/4 → rojo en el tablero. */
function belowQuarterFluid(raw: string): FluidReading {
  return { raw, percent: FLUID_QUARTER_PERCENT - 10, level: "low", critical: true };
}

/** En 1/4 (reserva) → amarillo. */
function quarterFluid(raw: string): FluidReading {
  return { raw, percent: FLUID_QUARTER_PERCENT, level: "low", critical: false };
}

function mediumFluid(raw: string): FluidReading {
  return { raw, percent: 35, level: "low", critical: false };
}

function shouldOverride(current: FluidReading, next: FluidReading): boolean {
  if (!next.raw) return false;
  if (!current.raw?.trim()) return true;
  return next.percent < current.percent;
}

/** Ajusta niveles de fluidos según lo declarado en observaciones. */
export function applyObsFluidOverrides(
  inspeccion: InspeccionVehiculo | undefined,
  observaciones: string
): InspeccionVehiculo | undefined {
  if (!inspeccion) return inspeccion;

  const obs = observaciones.toLowerCase();
  if (!obs.trim()) return inspeccion;

  const next = { ...inspeccion };

  const patch = (
    key: keyof Pick<
      InspeccionVehiculo,
      "combustible" | "aceite" | "refrigerante" | "liquidoFrenos"
    >,
    reading: FluidReading
  ) => {
    if (shouldOverride(next[key], reading)) {
      next[key] = reading;
    }
  };

  if (/combustible\s+.*(?:1\/4|reserva)(?!\s*(?:de\s+)?(?:aceite|fluido))/i.test(obs)) {
    patch("combustible", quarterFluid("1/4 (obs.)"));
  } else if (
    /combustible\s+.*(?:muy\s+)?bajo|menos\s+de\s+1\/4\s+de\s+combustible/i.test(
      obs
    )
  ) {
    patch("combustible", belowQuarterFluid("BAJO (obs.)"));
  }

  if (/aceite\s+m[ií]nimo/i.test(obs)) {
    next.aceite = mediumFluid("MÍNIMO (obs.)");
  } else if (/aceite\s+.*1\/4/i.test(obs)) {
    patch("aceite", quarterFluid("1/4 (obs.)"));
  } else if (
    /aceite\s+muy\s+bajo|nivel\s+de\s+aceite\s+bajo/i.test(obs)
  ) {
    patch("aceite", belowQuarterFluid("MUY BAJO (obs.)"));
  } else if (/aceite\s+bajo/i.test(obs)) {
    patch("aceite", mediumFluid("BAJO (obs.)"));
  } else if (/aceite\s+medio|aceite\s+.*1\/2/i.test(obs)) {
    patch("aceite", mediumFluid("MEDIO (obs.)"));
  }

  if (/refrigerante\s+m[ií]nimo|refrigeraci[oó]n\s+m[ií]nima/i.test(obs)) {
    next.refrigerante = mediumFluid("MÍNIMO (obs.)");
  } else if (/refrigerante\s+.*1\/4/i.test(obs)) {
    patch("refrigerante", quarterFluid("1/4 (obs.)"));
  } else if (/refrigerante\s+muy\s+bajo|refrigeraci[oó]n\s+baja/i.test(obs)) {
    patch("refrigerante", belowQuarterFluid("MUY BAJO (obs.)"));
  } else if (/refrigerante\s+bajo/i.test(obs)) {
    patch("refrigerante", mediumFluid("BAJO (obs.)"));
  } else if (/refrigerante\s+medio|refrigerante\s+.*1\/2/i.test(obs)) {
    patch("refrigerante", mediumFluid("MEDIO (obs.)"));
  }

  if (/l[ií]quido\s+de?\s*frenos?\s+.*1\/4|frenos?\s+.*1\/4/i.test(obs)) {
    patch("liquidoFrenos", quarterFluid("1/4 (obs.)"));
  } else if (
    /l[ií]quido\s+de?\s*frenos?\s+muy\s+bajo|frenos?\s+muy\s+bajo/i.test(obs)
  ) {
    patch("liquidoFrenos", belowQuarterFluid("MUY BAJO (obs.)"));
  } else if (/l[ií]quido\s+de?\s*frenos?\s+bajo|frenos?\s+bajo/i.test(obs)) {
    patch("liquidoFrenos", mediumFluid("BAJO (obs.)"));
  } else if (/l[ií]quido\s+de?\s*frenos?\s+medio|frenos?\s+.*1\/2/i.test(obs)) {
    patch("liquidoFrenos", mediumFluid("MEDIO (obs.)"));
  }

  if (/menos\s+de\s+1\/4\s+de\s+fluidos?|fluidos?\s+muy\s+bajos?/i.test(obs)) {
    patch("combustible", belowQuarterFluid("1/4 (obs.)"));
    patch("aceite", belowQuarterFluid("BAJO (obs.)"));
    patch("refrigerante", belowQuarterFluid("BAJO (obs.)"));
    patch("liquidoFrenos", belowQuarterFluid("BAJO (obs.)"));
  }

  if (/luces?\s+bajas?\s+(?:quemadas?|sin\s+funcionar|no\s+funciona)/i.test(obs)) {
    next.luces = {
      ...next.luces,
      bajas: { ok: false, raw: "NO (obs.)" },
    };
  }

  if (/luces?\s+altas?\s+(?:quemadas?|sin\s+funcionar|no\s+funciona)/i.test(obs)) {
    next.luces = {
      ...next.luces,
      altas: { ok: false, raw: "NO (obs.)" },
    };
  }

  return next;
}
