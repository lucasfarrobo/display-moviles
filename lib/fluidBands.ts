import type { FluidReading } from "./inspection";
import type { Status } from "./types";

/** 0–24 % fuera de servicio, 25–49 % atención, ≥50 % operativo (aceite, refrigerante, frenos). */
export function motorFluidStatusFromPercent(percent: number): Status | null {
  if (percent < 25) return "outOfService";
  if (percent < 50) return "attention";
  return null;
}

/** Combustible en reserva (< 1/4) → atención; se repone en operación. */
export function combustibleStatusFromPercent(percent: number): Status | null {
  if (!Number.isFinite(percent) || percent <= 0) return null;
  if (percent < 50) return "attention";
  return null;
}

export function isFluidOutOfServicePercent(percent: number): boolean {
  return percent < 25;
}

export function fluidGaugeColorFromPercent(percent: number): string {
  if (percent < 25) return "#ef4444";
  if (percent < 50) return "#f59e0b";
  return "#22c55e";
}

export function fluidGaugeColor(reading: FluidReading): string {
  if (!reading.raw?.trim()) return "#64748b";
  return fluidGaugeColorFromPercent(reading.percent);
}
