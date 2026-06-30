"use client";

import type { FluidReading, InspeccionVehiculo, LuzEstado } from "@/lib/inspection";
import { hasFluidoCritico, hasLuzFallida } from "@/lib/inspection";

function fluidColor(reading: FluidReading): string {
  if (reading.critical || reading.level === "low") return "#ef4444";
  if (reading.level === "medium") return "#f59e0b";
  if (reading.level === "full") return "#22c55e";
  return "#64748b";
}

function FluidGauge({ label, reading }: { label: string; reading: FluidReading }) {
  const color = fluidColor(reading);
  const pct = Math.max(8, Math.min(100, reading.percent || 0));
  const display = reading.raw || "—";

  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      <div className="relative w-10 h-16 border-2 border-slate-600 rounded-md overflow-hidden bg-slate-900/80">
        <div
          className="absolute bottom-0 left-0 right-0 transition-all"
          style={{ height: `${pct}%`, backgroundColor: color }}
        />
        {[50].map((mark) => (
          <div
            key={mark}
            className="absolute left-0 right-0 border-t border-slate-600/80"
            style={{ bottom: `${mark}%` }}
          />
        ))}
      </div>
      <span className="text-slate-300 text-[11px] font-medium text-center leading-tight">
        {label}
      </span>
      <span
        className={`text-[10px] font-semibold ${reading.critical ? "text-red-400" : "text-slate-400"}`}
      >
        {display}
      </span>
    </div>
  );
}

function LuzItem({ label, luz }: { label: string; luz: LuzEstado }) {
  if (luz.ok) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <span className="text-slate-300 text-xs">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-950/50 border border-red-800">
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 text-amber-400 flex-shrink-0"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2L1 21h22L12 2zm0 4.5l7.1 12.5H4.9L12 6.5zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" />
      </svg>
      <div>
        <span className="text-red-300 text-xs font-semibold block">{label}</span>
        <span className="text-red-400/80 text-[10px]">Revisar — NO funciona</span>
      </div>
    </div>
  );
}

interface Props {
  inspeccion: InspeccionVehiculo;
}

export function InspectionPanel({ inspeccion }: Props) {
  const alerta =
    hasFluidoCritico(inspeccion) || hasLuzFallida(inspeccion);

  return (
    <div className="mb-4">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
        Inspección actual
        {alerta && (
          <span className="ml-2 text-red-400 normal-case font-normal">
            · requiere atención
          </span>
        )}
      </h3>

      <div className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
        <FluidGauge label="Combustible" reading={inspeccion.combustible} />
        <FluidGauge label="Aceite" reading={inspeccion.aceite} />
        <FluidGauge label="Refrigerante" reading={inspeccion.refrigerante} />
        <FluidGauge label="Líq. frenos" reading={inspeccion.liquidoFrenos} />
      </div>

      <div className="space-y-2">
        <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">
          Luces (J · K · L)
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          <LuzItem label="Luces altas" luz={inspeccion.luces.altas} />
          <LuzItem label="Luces bajas" luz={inspeccion.luces.bajas} />
          <LuzItem label="Baliza aérea" luz={inspeccion.luces.baliza} />
        </div>
      </div>
    </div>
  );
}

export { hasFluidoCritico, hasLuzFallida };
