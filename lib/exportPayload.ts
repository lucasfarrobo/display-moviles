import type { Mobile, MobilesResponse, Novedad } from "./types";

/** Historial solo necesita texto/fecha — la inspección va una vez por móvil. */
function slimNovedad(n: Novedad): Novedad {
  const { inspeccion: _removed, ...rest } = n;
  return rest;
}

/** Reduce el JSON público (~80% menos) para carga rápida en GitHub Pages. */
export function slimMobileForExport(mobile: Mobile): Mobile {
  return {
    ...mobile,
    ultimaNovedad: slimNovedad(mobile.ultimaNovedad),
    historial: mobile.historial.map(slimNovedad),
  };
}

export function slimMobilesResponse(data: MobilesResponse): MobilesResponse {
  return {
    ...data,
    mobiles: data.mobiles.map(slimMobileForExport),
  };
}

/** JSON liviano para consulta rápida en teléfonos. */
export function buildMobileSummary(data: MobilesResponse) {
  return {
    updatedAt: data.updatedAt,
    source: data.source,
    mobiles: data.mobiles.map((m) => ({
      id: m.id,
      numero: m.numero,
      nombre: m.nombre,
      patente: m.patente,
      status: m.status,
      jefeDeCoche: m.jefeDeCoche,
      chofer: m.chofer,
      ultimaActualizacion: m.ultimaActualizacion,
      motivoFueraDeServicio: m.motivoFueraDeServicio,
    })),
  };
}
