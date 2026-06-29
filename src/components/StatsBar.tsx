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
  if (!stats) return <div className="stats-bar stats-bar--empty">No stats</div>;
  const tone = stats.avg_tone != null ? stats.avg_tone.toFixed(2) : "—";
  return (
    <section className="stats-bar">
      <div className="stat">
        <span className="stat__label">Incidents</span>
        <span className="stat__value">{stats.total.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="stat__label">Actors</span>
        <span className="stat__value">{stats.actors.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="stat__label">Countries</span>
        <span className="stat__value">{stats.countries.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="stat__label">Avg tone</span>
        <span className={`stat__value ${toneClass(stats.avg_tone)}`}>{tone}</span>
      </div>
      <div className="stat stat--range">
        <span className="stat__label">Window</span>
        <span className="stat__value stat__value--sm">
          {stats.from_ts ? new Date(stats.from_ts).toISOString().slice(0, 10) : "—"}
          {" → "}
          {stats.to_ts ? new Date(stats.to_ts).toISOString().slice(0, 10) : "—"}
        </span>
      </div>
    </section>
  );
}

function toneClass(t: number | null): string {
  if (t == null) return "";
  if (t < -3) return "stat__value--bad";
  if (t > 0) return "stat__value--good";
  return "";
}
