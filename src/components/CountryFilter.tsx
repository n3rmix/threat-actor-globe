import { useMemo, useState } from "react";
import type { CountryOption } from "../../shared/types.js";
import { Button, Input, ScrollShadow } from "@heroui/react";

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
    <section className="flex min-h-0 flex-col border-r border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h2 className="m-0 text-[11px] uppercase tracking-wider text-muted">
          Targeted Countries
        </h2>
        {selected.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onClear}
            className="h-auto px-1.5 py-0.5 text-[11px] text-muted"
          >
            Clear ({selected.size})
          </Button>
        )}
      </header>

      <div className="relative m-2">
        <Input
          aria-label="Search countries"
          placeholder="Search country…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      <ScrollShadow className="flex-1 min-h-0 px-2 pb-2" size={24}>
        {filtered.length === 0 && (
          <div className="py-5 text-center text-xs text-muted">
            No data yet. Run ingest.
          </div>
        )}
        {filtered.map((c) => {
          const active = selected.has(c.code);
          const pct = totalShown > 0 ? (c.count / totalShown) * 100 : 0;
          return (
            <button
              key={c.code}
              onClick={() => onToggle(c.code)}
              title={`${c.name} (${c.code}) — ${c.count} incidents`}
              className={`group grid w-full grid-cols-[20px_1fr_56px_auto] items-center gap-2 border-b border-separator px-2 py-1.5 text-left text-xs transition-colors ${
                active
                  ? "bg-accent/10 shadow-[inset_2px_0_0_var(--accent)]"
                  : "hover:bg-surface-secondary"
              }`}
            >
              <span className="text-sm">{flagEmoji(c.code)}</span>
              <span className="truncate text-foreground" title={c.name}>
                {c.name}
              </span>
              <span className="h-1 overflow-hidden rounded-full bg-foreground/10">
                <span
                  className="block h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </span>
              <span className="tnum text-right text-muted">{c.count}</span>
            </button>
          );
        })}
      </ScrollShadow>

      {onFit && selected.size > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onPress={() => onFit(getWorldBounds())}
          className="mx-3 mb-3"
        >
          Zoom to selection
        </Button>
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
