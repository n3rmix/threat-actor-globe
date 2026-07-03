import { useMemo, useState } from "react";
import type { IncidentFeature } from "../../shared/types.js";
import { Input, ScrollShadow, Chip } from "@heroui/react";

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
    <section className="flex min-h-0 flex-1 flex-col border-t border-border">
      <header className="flex items-baseline justify-between px-3 pb-0.5 pt-2.5">
        <h3 className="m-0 text-[11px] uppercase tracking-wider text-muted">
          Events
        </h3>
        <span className="tnum text-[11px] text-muted">
          {filtered.length} / {features.length}
        </span>
      </header>
      <div className="px-2 text-[11px] text-accent">{label}</div>
      <div className="relative m-2">
        <Input
          aria-label="Filter events"
          placeholder="Filter by title, actor, theme…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
      <ScrollShadow className="min-h-0 flex-1 px-2 pb-2" size={24}>
        {filtered.length === 0 && (
          <div className="py-6 text-center text-xs text-muted">
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
      </ScrollShadow>
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
  const toneColor =
    p.tone == null
      ? "default"
      : p.tone < -3
        ? "danger"
        : p.tone < 0
          ? "warning"
          : "success";

  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col gap-1 border-b border-separator px-2 py-2 text-left transition-colors ${
        active
          ? "bg-accent/10 shadow-[inset_2px_0_0_var(--accent)]"
          : "hover:bg-surface-secondary"
      }`}
    >
      <div className="flex items-center justify-between text-[10px]">
        <Chip
          size="sm"
          variant="soft"
          color={toneColor}
          className="tnum text-[10px]"
        >
          {tone}
        </Chip>
        <span className="tnum text-muted">{date}</span>
      </div>
      <div
        className="line-clamp-2 text-xs leading-snug text-foreground"
        title={p.title ?? p.domain ?? "Untitled"}
      >
        {p.title ?? p.domain ?? "Untitled incident"}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
        {p.actor && (
          <span className="max-w-[120px] truncate text-accent">
            {p.actor}
          </span>
        )}
        <code className="rounded bg-surface-secondary px-1 py-px text-[10px]">
          {p.theme}
        </code>
        <span className="tnum ml-auto">
          {p.victim_country_code ?? "—"}
        </span>
      </div>
    </button>
  );
}
