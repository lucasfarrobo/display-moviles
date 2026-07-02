import type { FluidReading } from "./inspection";
import type { Status } from "./types";

/** Umbral 1/4 en el tablero (coincide con la lectura «1/4» del formulario). */
export const FLUID_QUARTER_PERCENT = 25;

/** ≥50 % operativo; 1/4–49 % amarillo; &lt;1/4 rojo. Aplica a todos los fluidos. */
export function fluidStatusFromPercent(percent: number): Status | null {
  if (percent < FLUID_QUARTER_PERCENT) return "outOfService";
  if (percent < 50) return "attention";
  return null;
}

export function isFluidOutOfServicePercent(percent: number): boolean {
  return percent < FLUID_QUARTER_PERCENT;
}

export function fluidGaugeColorFromPercent(percent: number): string {
  if (percent < FLUID_QUARTER_PERCENT) return "#ef4444";
  if (percent < 50) return "#f59e0b";
  return "#22c55e";
}

export function fluidGaugeColor(reading: FluidReading): string {
  if (!reading.raw?.trim()) return "#64748b";
  return fluidGaugeColorFromPercent(reading.percent);
}
