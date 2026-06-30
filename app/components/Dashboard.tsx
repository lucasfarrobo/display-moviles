"use client";

import { useEffect, useState } from "react";
import type { Mobile, MobilesResponse, Status } from "@/lib/types";
import { withBasePath } from "@/lib/basePath";
import { sanitizeMobiles } from "@/lib/sanitizeMobile";
import { MobileCard } from "./MobileCard";
import { DetailPanel } from "./DetailPanel";

type Filter = Status | "all";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "operational", label: "Operativos" },
  { value: "attention", label: "A tener en cuenta" },
  { value: "outOfService", label: "Fuera de servicio" },
];

export function Dashboard() {
  const [mobiles, setMobiles] = useState<Mobile[]>([]);
  const [dataSource, setDataSource] = useState<"sheets" | "mock">("mock");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    fetch(withBasePath("/data/mobiles.json"), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MobilesResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.mobiles)) {
          throw new Error("Formato de datos inválido");
        }
        setMobiles(sanitizeMobiles(data.mobiles));
        setDataSource(data.source);
        setUpdatedAt(data.updatedAt);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[Dashboard] Error cargando datos:", err);
        setError(
          err instanceof DOMException && err.name === "AbortError"
            ? "La carga tardó demasiado. Refrescá la página (Ctrl+F5)."
            : "No se pudieron cargar los datos del Sheet. Refrescá la página."
        );
        setMobiles([]);
        setDataSource("mock");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        clearTimeout(timeout);
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const counts = {
    operational: mobiles.filter((m) => m.status === "operational").length,
    attention: mobiles.filter((m) => m.status === "attention").length,
    outOfService: mobiles.filter((m) => m.status === "outOfService").length,
  };

  const filtered =
    filter === "all" ? mobiles : mobiles.filter((m) => m.status === filter);

  const selectedMobile = mobiles.find((m) => m.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
        <p>Cargando móviles…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-red-400 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Display de Móviles</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Estado actual por unidad · historial de novedades desde Google Sheets
          </p>
        </div>
        <div className="text-right">
          <span className="text-slate-500 text-xs block">
            {mobiles.length} unidades
          </span>
          <span className="text-slate-600 text-[10px] block">
            {dataSource === "sheets" ? "Datos del Sheet" : "Datos de prueba"}
          </span>
          {updatedAt && (
            <span className="text-slate-600 text-[10px] block">
              Actualizado: {new Date(updatedAt).toLocaleString("es-AR")}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-950/50 border border-green-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-green-400">{counts.operational}</p>
          <p className="text-green-300 text-sm mt-1">Operativos</p>
        </div>
        <div className="bg-amber-950/50 border border-amber-700 rounded-xl p-4">
          <p className="text-3xl font-bold text-amber-400">{counts.attention}</p>
          <p className="text-amber-300 text-sm mt-1">A tener en cuenta</p>
        </div>
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-red-400">{counts.outOfService}</p>
          <p className="text-red-300 text-sm mt-1">Fuera de servicio</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === opt.value
                ? "bg-slate-200 text-slate-900 border-slate-200"
                : "bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
          <div
            className={`grid gap-3 ${
              selectedMobile ? "grid-cols-2 lg:grid-cols-2" : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filtered.map((mobile) => (
              <MobileCard
                key={mobile.id}
                mobile={mobile}
                selected={selectedId === mobile.id}
                onClick={() =>
                  setSelectedId(selectedId === mobile.id ? null : mobile.id)
                }
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-12">
              No hay unidades en este estado.
            </p>
          )}
        </div>

        {selectedMobile && (
          <div className="w-full lg:w-[28rem] flex-shrink-0 sticky top-6">
            <DetailPanel
              mobile={selectedMobile}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>

      <p className="text-center text-slate-600 text-xs mt-8">
        Click en una unidad para ver el historial · Se usa la novedad más reciente por marca temporal
      </p>
    </div>
  );
}
