interface TimelinePoint {
  day: string;
  count: number;
  avg_tone: number | null;
}

interface Props {
  timeline: TimelinePoint[];
}

export function TimelinePanel({ timeline }: Props) {
  if (timeline.length === 0) {
    return (
      <section className="px-3 py-3 text-center text-xs text-muted">
        No timeline data
      </section>
    );
  }
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);
  const width = 360;
  const height = 80;
  const barWidth = width / timeline.length;

  const points = timeline.map((t, i) => ({
    x: i * barWidth + barWidth / 2,
    y: height - (t.count / maxCount) * (height - 8) - 4,
    ...t,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <section className="flex-shrink-0 px-3 py-2.5">
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="m-0 text-[11px] uppercase tracking-wider text-muted">
          Daily volume
        </h3>
        <span className="tnum text-[11px] text-muted">
          {timeline[0].day} → {timeline[timeline.length - 1].day}
        </span>
      </header>
      <svg
        className="block h-[90px] w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <path d={linePath} fill="none" stroke="#5ad1ff" strokeWidth="1.5" />
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - barWidth / 2 + 0.5}
            y={p.y}
            width={Math.max(0.5, barWidth - 1)}
            height={height - p.y}
            fill={toneBar(p.avg_tone)}
            opacity={0.7}
          >
            <title>{`${p.day}: ${p.count} incidents, tone ${p.avg_tone?.toFixed(2) ?? "—"}`}</title>
          </rect>
        ))}
      </svg>
    </section>
  );
}

function toneBar(t: number | null): string {
  if (t == null) return "#888";
  if (t < -3) return "#b22222";
  if (t < 0) return "#e08a3a";
  return "#2166ac";
}
