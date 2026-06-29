import { useMemo, useState } from "react";
import type { IncidentFeature } from "../../shared/types.js";

interface Props {
  features: IncidentFeature[];
  selectedCountries: Set<string>;
  onSelect: (feature: IncidentFeature) => void;
  activeId?: number | null;
}

export function IncidentList({ features, selectedCountries, onSelect, activeId }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return features;
    return features.filter(
      (f) =>
        f.properties.title?.toLowerCase().includes(q) ||
        f.properties.domain?.toLowerCase().includes(q) ||
        f.properties.actor?.toLowerCase().includes(q) ||
        f.properties.theme?.toLowerCase().includes(q)
    );
  }, [features, query]);

  const label =
    selectedCountries.size > 0
      ? `${selectedCountries.size} country${selectedCountries.size > 1 ? "ies" : ""} selected`
      : "All countries";

  return (
    <section className="incident-list">
      <header className="incident-list__header">
        <h3>Events</h3>
        <span className="incident-list__count">
          {filtered.length} / {features.length}
        </span>
      </header>
      <div className="incident-list__sub">{label}</div>
      <input
        className="incident-list__search"
        placeholder="Filter by title, actor, theme…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="incident-list__items">
        {filtered.length === 0 && (
          <div className="incident-list__empty">
            {features.length === 0
              ? "No incidents loaded. Run ingest."
              : "No events match the current filters."}
          </div>
        )}
        {filtered.map((f) => (
          <IncidentRow
            key={f.properties.id}
            feature={f}
            active={activeId === f.properties.id}
            onClick={() => onSelect(f)}
          />
        ))}
      </div>
    </section>
  );
}

function IncidentRow({
  feature,
  active,
  onClick,
}: {
  feature: IncidentFeature;
  active: boolean;
  onClick: () => void;
}) {
  const p = feature.properties;
  const date = new Date(p.published_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const tone = p.tone != null ? p.tone.toFixed(1) : "—";
  return (
    <button
      className={`incident-row ${active ? "incident-row--active" : ""}`}
      onClick={onClick}
    >
      <div className="incident-row__top">
        <span className={`incident-row__tone ${toneClass(p.tone)}`}>{tone}</span>
        <span className="incident-row__date">{date}</span>
      </div>
      <div className="incident-row__title" title={p.title ?? p.domain ?? "Untitled"}>
        {p.title ?? p.domain ?? "Untitled incident"}
      </div>
      <div className="incident-row__meta">
        {p.actor && <span className="incident-row__actor">{p.actor}</span>}
        <code className="incident-row__theme">{p.theme}</code>
        <span className="incident-row__country">
          {p.victim_country_code ?? "—"}
        </span>
      </div>
    </button>
  );
}

function toneClass(t: number | null): string {
  if (t == null) return "";
  if (t < -3) return "incident-row__tone--bad";
  if (t < 0) return "incident-row__tone--warn";
  return "incident-row__tone--good";
}
