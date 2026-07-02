"use client";

import type { Mobile, Status } from "@/lib/types";
import { isSinNovedadTexto, isHigieneOnlyTexto, shouldHideFromHistorial } from "@/lib/status";
import { lucesPrecaucionTexto } from "@/lib/inspection";

const STATUS_CONFIG: Record<
  Status,
  { label: string; bg: string; border: string; dot: string; text: string; ring: string }
> = {
  operational: {
    label: "Operativo",
    bg: "bg-green-950/60",
    border: "border-green-800",
    dot: "bg-green-400",
    text: "text-green-300",
    ring: "ring-green-400",
  },
  attention: {
    label: "A tener en cuenta",
    bg: "bg-amber-950/60",
    border: "border-amber-700",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "ring-amber-400",
  },
  outOfService: {
    label: "Fuera de servicio",
    bg: "bg-red-950/60",
    border: "border-red-800",
    dot: "bg-red-500",
    text: "text-red-300",
    ring: "ring-red-500",
  },
};

interface Props {
  mobile: Mobile;
  selected: boolean;
  onClick: () => void;
}

export function MobileCard({ mobile, selected, onClick }: Props) {
  const cfg = STATUS_CONFIG[mobile.status] ?? STATUS_CONFIG.operational;
  const rawPreview = mobile.ultimaNovedad?.texto ?? "";
  const preview =
    isSinNovedadTexto(rawPreview) || isHigieneOnlyTexto(rawPreview)
      ? mobile.historial.find(
          (n) => !shouldHideFromHistorial(n.texto) && n.texto.trim()
        )?.texto
      : rawPreview;

  const alertaInspeccion = mobile.status !== "operational";
  const leyendaLuces =
    mobile.status !== "outOfService" && mobile.inspeccion
      ? lucesPrecaucionTexto(mobile.inspeccion)
      : null;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border p-3 transition-all duration-150 cursor-pointer
        ${cfg.bg} ${cfg.border}
        ${selected ? `ring-2 ${cfg.ring}` : "hover:brightness-110"}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className={`font-bold text-base truncate ${cfg.text}`}>
            {mobile.numero}
          </span>
        </div>

        <div className="flex flex-col items-end text-right flex-shrink-0 max-w-[58%]">
          <div className="flex items-center gap-1.5">
            {leyendaLuces && (
              <span
                className="text-amber-400 text-xs"
                title={leyendaLuces}
              >
                ⚠
              </span>
            )}
            {alertaInspeccion && (
              <span className="text-amber-400 text-xs" title="Revisar inspección">
                ⚠
              </span>
            )}
            {mobile.totalNovedades > 1 && (
              <span className="text-slate-400 text-xs">
                {mobile.totalNovedades} novedades
              </span>
            )}
          </div>
          {mobile.jefeDeCoche && (
            <p className="text-slate-400 text-[10px] leading-snug mt-1 line-clamp-2">
              <span className="text-slate-500">Jefe de Coche:</span> {mobile.jefeDeCoche}
            </p>
          )}
          {mobile.chofer && (
            <p className="text-slate-400 text-[10px] leading-snug mt-0.5 line-clamp-2">
              <span className="text-slate-500">Chofer:</span> {mobile.chofer}
            </p>
          )}
        </div>
      </div>

      {mobile.nombre && (
        <div className="text-slate-200 text-sm font-medium truncate">
          {mobile.nombre}
        </div>
      )}
      {mobile.patente && (
        <div className="text-slate-400 text-xs mt-0.5">{mobile.patente}</div>
      )}

      {leyendaLuces && (
        <div className="mt-1.5 px-2 py-1 rounded text-[10px] bg-amber-950/40 border border-amber-800/50 text-amber-300 flex items-center gap-1.5">
          <span aria-hidden>⚠</span>
          {leyendaLuces}
        </div>
      )}

      {preview && (
        <div className={`mt-2 px-2 py-1 rounded text-xs bg-black/30 line-clamp-2 ${cfg.text}`}>
          {preview}
        </div>
      )}
    </button>
  );
}

export { STATUS_CONFIG };
