export type FluidLevel = "full" | "medium" | "low" | "unknown";

export interface FluidReading {
  raw: string;
  percent: number;
  level: FluidLevel;
  critical: boolean;
}

export interface LuzEstado {
  ok: boolean;
  raw: string;
}

export interface InspeccionVehiculo {
  combustible: FluidReading;
  aceite: FluidReading;
  refrigerante: FluidReading;
  liquidoFrenos: FluidReading;
  luces: {
    altas: LuzEstado;
    bajas: LuzEstado;
    baliza: LuzEstado;
  };
}

export interface InspectionCells {
  combustible: string;
  aceite: string;
  refrigerante: string;
  liquidoFrenos: string;
  lucesAltas: string;
  lucesBajas: string;
  lucesBaliza: string;
}

function emptyFluid(): FluidReading {
  return { raw: "", percent: 0, level: "unknown", critical: false };
}

function emptyInspeccion(): InspeccionVehiculo {
  return {
    combustible: emptyFluid(),
    aceite: emptyFluid(),
    refrigerante: emptyFluid(),
    liquidoFrenos: emptyFluid(),
    luces: {
      altas: { ok: true, raw: "" },
      bajas: { ok: true, raw: "" },
      baliza: { ok: true, raw: "" },
    },
  };
}

export function parseCombustible(raw: string): FluidReading {
  const val = raw.trim().toUpperCase();
  if (!val) return emptyFluid();

  if (val.includes("LLENO")) {
    return { raw, percent: 100, level: "full", critical: false };
  }
  if (val.includes("3/4")) {
    return { raw, percent: 75, level: "medium", critical: false };
  }
  if (val.includes("1/2") || val === "MEDIO") {
    return { raw, percent: 50, level: "medium", critical: false };
  }
  if (val.includes("1/4") || val.includes("RESERVA")) {
    return { raw, percent: 20, level: "low", critical: true };
  }

  return { raw, percent: 0, level: "unknown", critical: false };
}

export function parseFluidLevel(raw: string): FluidReading {
  const val = raw.trim().toUpperCase();
  if (!val) return emptyFluid();

  if (val.includes("ALTO") || val.includes("LLENO")) {
    return { raw, percent: 100, level: "full", critical: false };
  }
  if (val.includes("MEDIO") || val.includes("1/2")) {
    return { raw, percent: 50, level: "medium", critical: false };
  }
  if (val.includes("1/4") || val.includes("RESERVA")) {
    return { raw, percent: 20, level: "low", critical: true };
  }
  if (val.includes("MUY BAJO")) {
    return { raw, percent: 10, level: "low", critical: true };
  }
  if (val.includes("BAJO")) {
    return { raw, percent: 35, level: "low", critical: false };
  }

  return { raw, percent: 0, level: "unknown", critical: false };
}

export function parseLuz(raw: string): LuzEstado {
  const val = raw.trim().toUpperCase();
  if (!val) return { ok: true, raw: "" };
  if (val === "NO") return { ok: false, raw };
  if (val === "SI") return { ok: true, raw };
  return { ok: true, raw };
}

export function parseInspeccion(cells: InspectionCells): InspeccionVehiculo {
  return {
    combustible: parseCombustible(cells.combustible),
    aceite: parseFluidLevel(cells.aceite),
    refrigerante: parseFluidLevel(cells.refrigerante),
    liquidoFrenos: parseFluidLevel(cells.liquidoFrenos),
    luces: {
      altas: parseLuz(cells.lucesAltas),
      bajas: parseLuz(cells.lucesBajas),
      baliza: parseLuz(cells.lucesBaliza),
    },
  };
}

export function hasLucesAltasFallidas(inspeccion: InspeccionVehiculo): boolean {
  return !inspeccion.luces.altas.ok;
}

export function hasLuzCriticaFallida(inspeccion: InspeccionVehiculo): boolean {
  return !inspeccion.luces.bajas.ok || !inspeccion.luces.baliza.ok;
}

export function hasLuzFallida(inspeccion: InspeccionVehiculo): boolean {
  return hasLucesAltasFallidas(inspeccion) || hasLuzCriticaFallida(inspeccion);
}

export function hasFluidoMedio(inspeccion: InspeccionVehiculo): boolean {
  const fluids = [
    inspeccion.combustible,
    inspeccion.aceite,
    inspeccion.refrigerante,
    inspeccion.liquidoFrenos,
  ];
  return fluids.some((f) => f.level === "medium");
}

export function hasFluidoCritico(inspeccion: InspeccionVehiculo): boolean {
  return (
    inspeccion.combustible.critical ||
    inspeccion.aceite.critical ||
    inspeccion.refrigerante.critical ||
    inspeccion.liquidoFrenos.critical
  );
}

export { emptyInspeccion };
