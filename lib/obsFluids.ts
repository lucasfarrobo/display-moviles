import type { FluidReading, InspeccionVehiculo } from "./inspection";

function lowFluid(raw: string): FluidReading {
  return { raw, percent: 20, level: "low", critical: true };
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

  if (
    /combustible\s+.*(?:1\/4|reserva|bajo|muy\s+bajo)|menos\s+de\s+1\/4\s+de\s+combustible/i.test(
      obs
    )
  ) {
    patch("combustible", lowFluid("1/4 (obs.)"));
  }

  if (
    /aceite\s+(?:muy\s+)?bajo|aceite\s+.*1\/4|nivel\s+de\s+aceite\s+bajo/i.test(
      obs
    )
  ) {
    patch("aceite", lowFluid("BAJO (obs.)"));
  } else if (/aceite\s+medio|aceite\s+.*1\/2/i.test(obs)) {
    patch("aceite", mediumFluid("MEDIO (obs.)"));
  }

  if (
    /refrigerante\s+(?:muy\s+)?bajo|refrigeraci[oó]n\s+baja|refrigerante\s+.*1\/4/i.test(
      obs
    )
  ) {
    patch("refrigerante", lowFluid("BAJO (obs.)"));
  } else if (/refrigerante\s+medio|refrigerante\s+.*1\/2/i.test(obs)) {
    patch("refrigerante", mediumFluid("MEDIO (obs.)"));
  }

  if (
    /l[ií]quido\s+de?\s*frenos?\s+(?:muy\s+)?bajo|l[ií]q\.?\s*frenos?\s+.*1\/4|frenos?\s+.*1\/4/i.test(
      obs
    )
  ) {
    patch("liquidoFrenos", lowFluid("BAJO (obs.)"));
  } else if (/l[ií]quido\s+de?\s*frenos?\s+medio|frenos?\s+.*1\/2/i.test(obs)) {
    patch("liquidoFrenos", mediumFluid("MEDIO (obs.)"));
  }

  if (/menos\s+de\s+1\/4\s+de\s+fluidos?|fluidos?\s+(?:muy\s+)?bajos?/i.test(obs)) {
    patch("combustible", lowFluid("1/4 (obs.)"));
    patch("aceite", lowFluid("BAJO (obs.)"));
    patch("refrigerante", lowFluid("BAJO (obs.)"));
    patch("liquidoFrenos", lowFluid("BAJO (obs.)"));
  }

  if (/luces?\s+bajas?\s+(?:quemadas?|sin\s+funcionar|no\s+funciona)/i.test(obs)) {
    next.luces = {
      ...next.luces,
      bajas: { ok: false, raw: "NO (obs.)" },
    };
  }

  return next;
}
