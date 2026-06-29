import { useMemo, useState } from "react";
import type { CountryOption } from "../../shared/types.js";

interface Props {
  countries: CountryOption[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  onClear: () => void;
  onFit?: (bounds: [[number, number], [number, number]]) => void;
}

export function CountryFilter({ countries, selected, onToggle, onClear, onFit }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const totalShown = filtered.reduce((sum, c) => sum + c.count, 0);

  return (
    <section className="country-filter">
      <header className="country-filter__header">
        <h2>Targeted Countries</h2>
        {selected.size > 0 && (
          <button className="link-btn" onClick={onClear}>
            Clear ({selected.size})
          </button>
        )}
      </header>

      <input
        className="country-filter__search"
        placeholder="Search country…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="country-filter__list">
        {filtered.length === 0 && (
          <div className="country-filter__empty">No data yet. Run ingest.</div>
        )}
        {filtered.map((c) => {
          const active = selected.has(c.code);
          const pct = totalShown > 0 ? (c.count / totalShown) * 100 : 0;
          return (
            <button
              key={c.code}
              className={`country-row ${active ? "country-row--active" : ""}`}
              onClick={() => onToggle(c.code)}
              title={`${c.name} (${c.code}) — ${c.count} incidents`}
            >
              <span className="country-row__flag">{flagEmoji(c.code)}</span>
              <span className="country-row__name" title={c.name}>
                {c.name}
              </span>
              <span className="country-row__bar">
                <span
                  className="country-row__bar-fill"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </span>
              <span className="country-row__count">{c.count}</span>
            </button>
          );
        })}
      </div>

      {onFit && selected.size > 0 && (
        <button className="country-filter__fit" onClick={() => onFit(getWorldBounds())}>
          Zoom to selection
        </button>
      )}
    </section>
  );
}

function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(
    ...code.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

function getWorldBounds(): [[number, number], [number, number]] {
  return [[-170, -75], [170, 80]];
}
