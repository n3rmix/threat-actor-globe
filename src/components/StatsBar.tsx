interface Stats {
  total: number;
  actors: number;
  countries: number;
  from_ts: string | null;
  to_ts: string | null;
  avg_tone: number | null;
}

interface Props {
  stats: Stats | null;
}

export function StatsBar({ stats }: Props) {
  if (!stats) {
    return (
      <div className="px-4 py-4 text-center text-xs text-muted">No stats</div>
    );
  }
  const tone = stats.avg_tone != null ? stats.avg_tone.toFixed(2) : "—";
  return (
    <section className="grid grid-cols-4 border-b border-border bg-surface">
      <Stat label="Incidents" value={stats.total.toLocaleString()} />
      <Stat label="Actors" value={stats.actors.toLocaleString()} />
      <Stat label="Countries" value={stats.countries.toLocaleString()} />
      <Stat
        label="Avg tone"
        value={tone}
        tone={toneTone(stats.avg_tone)}
      />
      <div className="col-span-4 flex items-center justify-between border-t border-separator px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted">
          Window
        </span>
        <span className="tnum text-[11px] text-muted">
          {stats.from_ts ? new Date(stats.from_ts).toISOString().slice(0, 10) : "—"}
          {" → "}
          {stats.to_ts ? new Date(stats.to_ts).toISOString().slice(0, 10) : "—"}
        </span>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const color =
    tone === "bad"
      ? "text-danger"
      : tone === "good"
        ? "text-success"
        : "text-foreground";
  return (
    <div className="flex flex-col gap-0.5 border-r border-separator px-3 py-2.5 last:border-r-0">
      <span className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className={`tnum text-base font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function toneTone(t: number | null): "good" | "bad" | undefined {
  if (t == null) return undefined;
  if (t < -3) return "bad";
  if (t > 0) return "good";
  return undefined;
}
