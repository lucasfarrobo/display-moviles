"use client";

import type { Mobile, Novedad } from "@/lib/types";
import { STATUS_CONFIG } from "./MobileCard";

interface Props {
  mobile: Mobile;
  onClose: () => void;
}

function HistorialItem({ item, isLatest }: { item: Novedad; isLatest: boolean }) {
  const cfg = STATUS_CONFIG[item.status];

  return (
    <div
      className={`relative pl-4 pb-4 border-l-2 ${
        isLatest ? cfg.border : "border-slate-700"
      } last:pb-0`}
    >
      <span
        className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${cfg.dot}`}
      />
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
        {isLatest && (
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            Actual
          </span>
        )}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{item.texto}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        <span className="text-slate-500 text-xs">{item.timestamp}</span>
        {item.reportadoPor && (
          <span className="text-slate-500 text-xs">· {item.reportadoPor}</span>
        )}
      </div>
    </div>
  );
}

export function DetailPanel({ mobile, onClose }: Props) {
  const cfg = STATUS_CONFIG[mobile.status];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-start justify-between mb-4 sticky top-0 bg-slate-900 pb-2">
        <div className="min-w-0 pr-2">
          <h2 className="text-lg font-bold text-white truncate">
            {mobile.numero}
          </h2>
          {mobile.nombre && (
            <p className="text-slate-300 text-sm truncate">{mobile.nombre}</p>
          )}
          {mobile.patente && (
            <p className="text-slate-400 text-sm">{mobile.patente}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xl leading-none px-1 flex-shrink-0"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <div
        className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${cfg.bg} border ${cfg.border}`}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
      </div>

      <div className="mb-4">
        <p className="text-slate-500 text-xs mb-0.5">Última actualización</p>
        <p className="text-slate-200 text-sm font-medium">
          {mobile.ultimaActualizacion}
        </p>
      </div>

      <hr className="border-slate-700 mb-4" />

      <div>
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
          Historial de novedades ({mobile.totalNovedades})
        </h3>
        <div className="space-y-0">
          {mobile.historial.map((item, idx) => (
            <HistorialItem key={item.id} item={item} isLatest={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
