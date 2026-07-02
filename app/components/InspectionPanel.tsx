"use client";

import type { FluidReading, InspeccionVehiculo, LuzEstado } from "@/lib/inspection";
import {
  hasLucesCarreteraFallidas,
  hasLuzFallida,
  lucesPrecaucionTexto,
} from "@/lib/inspection";
import { fluidGaugeColor } from "@/lib/fluidBands";
import { isAttentionFromInspection, isOutOfServiceFromInspection } from "@/lib/status";

function fluidColor(reading: FluidReading): string {
  return fluidGaugeColor(reading);
}

function FluidGauge({
  label,
  reading,
}: {
  label: string;
  reading: FluidReading;
}) {
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

function LuzItem({
  label,
  luz,
  reviewOnly = false,
}: {
  label: string;
  luz: LuzEstado;
  reviewOnly?: boolean;
}) {
  if (luz.ok) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <span className="text-slate-300 text-xs">{label}</span>
      </div>
    );
  }

  if (reviewOnly) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60">
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-amber-400 flex-shrink-0"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2L1 21h22L12 2zm0 4.5l7.1 12.5H4.9L12 6.5zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" />
        </svg>
        <div>
          <span className="text-amber-300 text-xs font-semibold block">{label}</span>
          <span className="text-amber-400/80 text-[10px]">
            A revisar — no funciona
          </span>
        </div>
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
  const alertaCritica = isOutOfServiceFromInspection(inspeccion);
  const alertaAtencion =
    !alertaCritica && isAttentionFromInspection(inspeccion);
  const lucesFallidas = hasLuzFallida(inspeccion);
  const precaucionLuces = lucesPrecaucionTexto(inspeccion);
  const soloPrecaucionLuces =
    Boolean(precaucionLuces) && !alertaCritica && !alertaAtencion;

  return (
    <div className="mb-4">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
        Inspección actual
        {alertaCritica && (
          <span className="ml-2 text-red-400 normal-case font-normal">
            · fuera de servicio
          </span>
        )}
        {alertaAtencion && (
          <span className="ml-2 text-amber-400 normal-case font-normal">
            · {lucesFallidas && !hasLucesCarreteraFallidas(inspeccion)
              ? "luces a revisar"
              : "a tener en cuenta"}
          </span>
        )}
        {soloPrecaucionLuces && (
          <span className="ml-2 text-amber-400 normal-case font-normal">
            · precaución luces
          </span>
        )}
      </h3>

      {soloPrecaucionLuces && precaucionLuces && (
        <div className="mb-3 px-2.5 py-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2">
          <span aria-hidden>⚠</span>
          {precaucionLuces} — móvil operativo
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
        <FluidGauge label="Combustible" reading={inspeccion.combustible} />
        <FluidGauge label="Aceite" reading={inspeccion.aceite} />
        <FluidGauge label="Refrigerante" reading={inspeccion.refrigerante} />
        <FluidGauge label="Líq. frenos" reading={inspeccion.liquidoFrenos} />
      </div>

      <div className="space-y-2">
        <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">
          Luces
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          <LuzItem label="Luces altas" luz={inspeccion.luces.altas} reviewOnly />
          <LuzItem label="Luces bajas" luz={inspeccion.luces.bajas} reviewOnly />
          <LuzItem label="Baliza aérea" luz={inspeccion.luces.baliza} reviewOnly />
        </div>
      </div>
    </div>
  );
}
