import type { InspeccionVehiculo } from "./inspection";

export type Status = "operational" | "attention" | "outOfService";

/** Una fila del formulario = una novedad reportada. */
export interface Novedad {
  id: string;
  timestamp: string;
  timestampMs: number;
  status: Status;
  texto: string;
  jefeDeCoche?: string;
  reportadoPor?: string;
  inspeccion?: InspeccionVehiculo;
}

/** Móvil agregado: estado actual + historial completo de novedades. */
export interface Mobile {
  id: string;
  numero: string;
  nombre: string;
  patente: string;
  status: Status;
  ultimaActualizacion: string;
  ultimaNovedad: Novedad;
  historial: Novedad[];
  totalNovedades: number;
  inspeccion?: InspeccionVehiculo;
  jefeDeCoche?: string;
  chofer?: string;
  /** Motivo confirmado cuando el tablero fuerza fuera de servicio. */
  motivoFueraDeServicio?: string;
}

export interface MobilesResponse {
  mobiles: Mobile[];
  updatedAt: string;
  source: "sheets" | "mock";
}

export interface MobileDetailResponse {
  mobile: Mobile;
  updatedAt: string;
  source: "sheets" | "mock";
}

// ─── Datos de prueba ────────────────────────────────────────────────────────

function n(
  id: string,
  ts: string,
  tsMs: number,
  status: Status,
  texto: string,
  reportadoPor?: string
): Novedad {
  return { id, timestamp: ts, timestampMs: tsMs, status, texto, reportadoPor };
}

export const MOCK_MOBILES: Mobile[] = [
  {
    id: "m-001",
    numero: "M-001",
    nombre: "Ambulancia Centro",
    patente: "ABC 123",
    status: "operational",
    ultimaActualizacion: "29/06/2026 08:15",
    ultimaNovedad: n(
      "n-001-3",
      "29/06/2026 08:15",
      Date.parse("2026-06-29T08:15:00"),
      "operational",
      "Unidad operativa. Revisión técnica al día.",
      "Juan Pérez"
    ),
    historial: [
      n(
        "n-001-3",
        "29/06/2026 08:15",
        Date.parse("2026-06-29T08:15:00"),
        "operational",
        "Unidad operativa. Revisión técnica al día.",
        "Juan Pérez"
      ),
      n(
        "n-001-2",
        "25/06/2026 14:00",
        Date.parse("2026-06-25T14:00:00"),
        "attention",
        "Aceite bajo — se completó en taller.",
        "Juan Pérez"
      ),
      n(
        "n-001-1",
        "20/06/2026 09:00",
        Date.parse("2026-06-20T09:00:00"),
        "operational",
        "Inspección mensual aprobada.",
        "Taller"
      ),
    ],
    totalNovedades: 3,
  },
  {
    id: "m-002",
    numero: "M-002",
    nombre: "Patrullero Sur",
    patente: "DEF 456",
    status: "attention",
    ultimaActualizacion: "29/06/2026 09:30",
    ultimaNovedad: n(
      "n-002-2",
      "29/06/2026 09:30",
      Date.parse("2026-06-29T09:30:00"),
      "attention",
      "Batería con baja carga (40%). Revisión programada.",
      "María García"
    ),
    historial: [
      n(
        "n-002-2",
        "29/06/2026 09:30",
        Date.parse("2026-06-29T09:30:00"),
        "attention",
        "Batería con baja carga (40%). Revisión programada.",
        "María García"
      ),
      n(
        "n-002-1",
        "28/06/2026 07:00",
        Date.parse("2026-06-28T07:00:00"),
        "operational",
        "Sin novedades al inicio de turno.",
        "María García"
      ),
    ],
    totalNovedades: 2,
  },
  {
    id: "m-003",
    numero: "M-003",
    nombre: "Ambulancia Norte",
    patente: "GHI 789",
    status: "outOfService",
    ultimaActualizacion: "28/06/2026 17:45",
    ultimaNovedad: n(
      "n-003-2",
      "28/06/2026 17:45",
      Date.parse("2026-06-28T17:45:00"),
      "outOfService",
      "Falla en sistema de frenos. Unidad inmovilizada.",
      "Carlos López"
    ),
    historial: [
      n(
        "n-003-2",
        "28/06/2026 17:45",
        Date.parse("2026-06-28T17:45:00"),
        "outOfService",
        "Falla en sistema de frenos. Unidad inmovilizada.",
        "Carlos López"
      ),
      n(
        "n-003-1",
        "28/06/2026 08:00",
        Date.parse("2026-06-28T08:00:00"),
        "operational",
        "Operativo al inicio del día.",
        "Carlos López"
      ),
    ],
    totalNovedades: 2,
  },
  {
    id: "m-004",
    numero: "M-004",
    nombre: "Camioneta Logística",
    patente: "JKL 012",
    status: "operational",
    ultimaActualizacion: "29/06/2026 07:00",
    ultimaNovedad: n(
      "n-004-1",
      "29/06/2026 07:00",
      Date.parse("2026-06-29T07:00:00"),
      "operational",
      "Combustible completo. Lista para despacho.",
      "Ana Martínez"
    ),
    historial: [
      n(
        "n-004-1",
        "29/06/2026 07:00",
        Date.parse("2026-06-29T07:00:00"),
        "operational",
        "Combustible completo. Lista para despacho.",
        "Ana Martínez"
      ),
    ],
    totalNovedades: 1,
  },
  {
    id: "m-005",
    numero: "M-005",
    nombre: "Patrullero Este",
    patente: "MNO 345",
    status: "attention",
    ultimaActualizacion: "29/06/2026 10:05",
    ultimaNovedad: n(
      "n-005-1",
      "29/06/2026 10:05",
      Date.parse("2026-06-29T10:05:00"),
      "attention",
      "Vidrio lateral izquierdo rajado. Puede continuar con precaución.",
      "Pedro Rodríguez"
    ),
    historial: [
      n(
        "n-005-1",
        "29/06/2026 10:05",
        Date.parse("2026-06-29T10:05:00"),
        "attention",
        "Vidrio lateral izquierdo rajado. Puede continuar con precaución.",
        "Pedro Rodríguez"
      ),
    ],
    totalNovedades: 1,
  },
  {
    id: "m-007",
    numero: "M-007",
    nombre: "Camioneta Operaciones",
    patente: "STU 901",
    status: "outOfService",
    ultimaActualizacion: "29/06/2026 11:20",
    ultimaNovedad: n(
      "n-007-1",
      "29/06/2026 11:20",
      Date.parse("2026-06-29T11:20:00"),
      "outOfService",
      "Motor con recalentamiento. Remolcada a taller.",
      "Roberto Díaz"
    ),
    historial: [
      n(
        "n-007-1",
        "29/06/2026 11:20",
        Date.parse("2026-06-29T11:20:00"),
        "outOfService",
        "Motor con recalentamiento. Remolcada a taller.",
        "Roberto Díaz"
      ),
    ],
    totalNovedades: 1,
  },
];
