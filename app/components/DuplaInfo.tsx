interface Props {
  jefeDeCoche?: string;
  chofer?: string;
  compact?: boolean;
}

export function DuplaInfo({ jefeDeCoche, chofer, compact }: Props) {
  if (!jefeDeCoche && !chofer) return null;

  if (compact) {
    return (
      <div className="mt-1.5 space-y-0.5">
        {jefeDeCoche && (
          <p className="text-slate-400 text-[11px] truncate">
            <span className="text-slate-500">Jefe:</span> {jefeDeCoche}
          </p>
        )}
        {chofer && (
          <p className="text-slate-400 text-[11px] truncate">
            <span className="text-slate-500">Chofer:</span> {chofer}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700 space-y-1.5">
      <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">
        Dupla
      </p>
      {jefeDeCoche && (
        <p className="text-slate-200 text-sm">
          <span className="text-slate-500">Jefe de coche:</span> {jefeDeCoche}
        </p>
      )}
      {chofer && (
        <p className="text-slate-200 text-sm">
          <span className="text-slate-500">Chofer:</span> {chofer}
        </p>
      )}
    </div>
  );
}
