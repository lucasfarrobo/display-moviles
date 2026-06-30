/**
 * Parseo de fechas en formato argentino DD/MM/YYYY.
 * No usa Date.parse() para evitar confundir 12/6 con diciembre.
 */

const DATE_TIME_RE =
  /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

/** "2:00:00 p.m." · "7:26:00 a.m." · "14:30" */
export function parseHora12h(raw: string): {
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  const text = raw?.trim();
  if (!text) return null;

  const match = text.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/i
  );
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  const ampm = match[4]?.toLowerCase().replace(/\./g, "").trim();

  if (ampm === "pm" || ampm === "p m") {
    if (hours < 12) hours += 12;
  } else if (ampm === "am" || ampm === "a m") {
    if (hours === 12) hours = 0;
  }

  return { hours, minutes, seconds };
}

export function parseDateDMY(
  raw: string,
  defaultTime?: { hours: number; minutes: number; seconds: number }
): number {
  const text = raw?.trim();
  if (!text) return 0;

  const match = text.match(DATE_TIME_RE);
  if (!match) return 0;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12 || day < 1 || day > 31) return 0;
  if (year < 2020 || year > new Date().getFullYear() + 1) return 0;

  const hours =
    match[4] !== undefined ? Number(match[4]) : (defaultTime?.hours ?? 0);
  const minutes =
    match[5] !== undefined ? Number(match[5]) : (defaultTime?.minutes ?? 0);
  const seconds =
    match[6] !== undefined ? Number(match[6]) : (defaultTime?.seconds ?? 0);

  return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
}

/**
 * Marca temporal (col 1) es la referencia principal: la genera Google al enviar
 * el formulario y es confiable. FECHA/HORA son manuales y pueden tener errores.
 */
export function resolveRowTimestamp(input: {
  marcaTemporal: string;
  fecha: string;
  hora: string;
}): { timestampMs: number; timestamp: string; fechaInspeccion?: string } {
  const fromMarca = parseDateDMY(input.marcaTemporal);

  if (fromMarca) {
    const fechaInspeccion =
      input.fecha && input.fecha !== input.marcaTemporal.split(" ")[0]
        ? [input.fecha, input.hora].filter(Boolean).join(" ").trim()
        : undefined;

    return {
      timestampMs: fromMarca,
      timestamp: input.marcaTemporal.trim(),
      fechaInspeccion,
    };
  }

  const horaParts = parseHora12h(input.hora);
  const fromFecha = parseDateDMY(input.fecha, horaParts ?? undefined);
  const display =
    [input.fecha, input.hora].filter(Boolean).join(" ").trim() || "Sin fecha";

  return {
    timestampMs: fromFecha,
    timestamp: display,
  };
}

/** @deprecated Usar resolveRowTimestamp */
export function parseTimestamp(raw: string): number {
  return parseDateDMY(raw);
}
