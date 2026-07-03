import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import type { Map as MLMap } from "maplibre-gl";
import type { IncidentFeature, CountryOption } from "../shared/types.js";
import {
  fetchCountries,
  fetchActors,
  fetchThemes,
  fetchIncidents,
  fetchStats,
  fetchTimeline,
  subscribeToStream,
} from "./api/client.js";
import { GlobeView } from "./components/GlobeView.js";
import { CountryFilter } from "./components/CountryFilter.js";
import { StatsBar } from "./components/StatsBar.js";
import { TimelinePanel } from "./components/TimelinePanel.js";
import { IncidentDrawer } from "./components/IncidentDrawer.js";
import { IncidentList } from "./components/IncidentList.js";
import { Button, Select, ListBox, Spinner } from "@heroui/react";

const LOOKBACK_DAYS_DEFAULT = 7;
const ALL = "__all__";

const LOOKBACKS = [
  { id: "1", label: "24h" },
  { id: "3", label: "3d" },
  { id: "7", label: "7d" },
  { id: "14", label: "14d" },
  { id: "30", label: "30d" },
];

export default function App() {
  const [features, setFeatures] = useState<IncidentFeature[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [actors, setActors] = useState<Array<{ name: string; count: number }>>([]);
  const [themes, setThemes] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [actorFilter, setActorFilter] = useState<string>("");
  const [lookbackDays, setLookbackDays] = useState(LOOKBACK_DAYS_DEFAULT);
  const [themeFilter, setThemeFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    actors: number;
    countries: number;
    from_ts: string | null;
    to_ts: string | null;
    avg_tone: number | null;
  } | null>(null);
  const [timeline, setTimeline] = useState<Array<{ day: string; count: number; avg_tone: number | null }>>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentFeature | null>(null);
  const mapRef = useRef<MLMap | null>(null);

  const selectIncident = useCallback((feature: IncidentFeature | null) => {
    setSelectedIncident(feature);
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      mapRef.current?.flyTo({
        center: [lon, lat],
        zoom: Math.max(mapRef.current?.getZoom() ?? 3, 4),
        duration: 1200,
        essential: true,
      });
    }
  }, []);

  const since = useMemo(() => {
    const d = new Date(Date.now() - lookbackDays * 86400 * 1000);
    return d.toISOString();
  }, [lookbackDays]);

  const countryParam = useMemo(
    () => Array.from(selectedCountries).sort(),
    [selectedCountries]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        since,
        country: countryParam.length ? countryParam : undefined,
        theme: themeFilter || undefined,
        actor: actorFilter || undefined,
        limit: 5000,
      };
      const [incidents, ctry, actrs, thms, st, tl] = await Promise.all([
        fetchIncidents(params),
        fetchCountries(),
        fetchActors({
          since,
          country: countryParam.length ? countryParam : undefined,
          theme: themeFilter || undefined,
        }),
        fetchThemes({
          since,
          country: countryParam.length ? countryParam : undefined,
        }),
        fetchStats(params),
        fetchTimeline(params),
      ]);
      setFeatures(incidents.features);
      setCountries(ctry);
      setActors(actrs);
      setThemes(thms);
      setStats(st);
      setTimeline(tl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [since, countryParam, themeFilter, actorFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const unsub = subscribeToStream(() => {
      loadAll();
    });
    return unsub;
  }, [loadAll]);

  const toggleCountry = useCallback((code: string) => {
    setSelectedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const clearCountries = useCallback(() => setSelectedCountries(new Set()), []);

  const layers = useMemo(() => {
    const points = features.map((f) => ({
      position: [f.geometry.coordinates[0], f.geometry.coordinates[1], 0],
      ...f.properties,
    }));

    return [
      new HexagonLayer({
        id: "hex-heat",
        data: points,
        getPosition: (d: { position: [number, number, number] }) => [d.position[0], d.position[1]],
        radius: 60000,
        elevationScale: 200,
        extruded: true,
        colorRange: [
          [33, 102, 172],
          [103, 169, 207],
          [209, 229, 240],
          [253, 219, 199],
          [239, 138, 98],
          [178, 24, 43],
        ],
        opacity: 0.55,
        pickable: false,
      }),
      new ScatterplotLayer({
        id: "incident-points",
        data: points,
        getPosition: (d: { position: [number, number, number] }) => d.position,
        getRadius: (d: { tone: number | null }) => (d.tone != null ? Math.min(80000, Math.abs(d.tone) * 5000) : 20000),
        radiusMinPixels: 3,
        radiusMaxPixels: 18,
        getFillColor: (d: { tone: number | null }) => toneColor(d.tone),
        opacity: 0.85,
        stroked: true,
        getLineColor: [255, 255, 255, 120],
        lineWidthMinPixels: 0.5,
        pickable: true,
        onClick: ({ object }) => {
          if (object) selectIncident(buildFeatureFromPoint(object));
        },
      }),
      ...(selectedIncident
        ? [
            new ScatterplotLayer({
              id: "incident-highlight",
              data: [
                {
                  position: [
                    selectedIncident.geometry.coordinates[0],
                    selectedIncident.geometry.coordinates[1],
                    0,
                  ],
                },
              ],
              getPosition: (d: { position: [number, number, number] }) => d.position,
              getRadius: 120000,
              radiusMinPixels: 12,
              radiusMaxPixels: 40,
              getFillColor: [90, 209, 255, 90],
              stroked: true,
              getLineColor: [90, 209, 255, 255],
              lineWidthMinPixels: 2,
              pickable: false,
            }),
          ]
        : []),
    ];
  }, [features, selectedIncident, selectIncident]);

  return (
    <div className="app-shell grid h-screen grid-rows-[auto_1fr]">
      <header className="relative z-10 flex flex-wrap items-center gap-4 border-b border-border bg-surface px-4 py-2.5">
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-tight tracking-wide text-foreground">
            Threat Actor Globe
          </h1>
          <span className="text-[11px] text-muted">
            GDELT live cyber-activity monitor
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Lookback"
            ariaLabel="Lookback window"
            selectedKey={String(lookbackDays)}
            onSelectionChange={(k) => setLookbackDays(Number(k))}
            width="w-[100px]"
          >
            {LOOKBACKS.map((o) => (
              <ListBox.Item key={o.id} id={o.id} textValue={o.label}>
                {o.label}
              </ListBox.Item>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Theme"
            ariaLabel="Filter by theme"
            selectedKey={themeFilter || ALL}
            onSelectionChange={(k) => setThemeFilter(k === ALL ? "" : String(k))}
            width="w-[180px]"
          >
            <ListBox.Item id={ALL} textValue="All themes">
              {`All (${features.length})`}
            </ListBox.Item>
            {themes.map((t) => (
              <ListBox.Item key={t.name} id={t.name} textValue={t.name}>
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate">{t.name}</span>
                  <span className="tnum text-[11px] text-muted">{t.count}</span>
                </span>
              </ListBox.Item>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Actor"
            ariaLabel="Filter by actor"
            selectedKey={actorFilter || ALL}
            onSelectionChange={(k) => setActorFilter(k === ALL ? "" : String(k))}
            width="w-[200px]"
          >
            <ListBox.Item id={ALL} textValue="All actors">
              All
            </ListBox.Item>
            {actors.map((a) => (
              <ListBox.Item key={a.name} id={a.name} textValue={a.name}>
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate">{a.name}</span>
                  <span className="tnum text-[11px] text-muted">{a.count}</span>
                </span>
              </ListBox.Item>
            ))}
          </FilterSelect>

          <Button
            variant="primary"
            size="sm"
            onPress={loadAll}
            isDisabled={loading}
            className="font-semibold"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </header>

      <main className="relative z-10 grid min-h-0 grid-cols-[300px_1fr_300px]">
        <CountryFilter
          countries={countries}
          selected={selectedCountries}
          onToggle={toggleCountry}
          onClear={clearCountries}
          onFit={(bounds: [[number, number], [number, number]]) =>
            mapRef.current?.fitBounds(bounds, { padding: 40 })
          }
        />

        <div className="relative min-w-0 bg-background">
          <GlobeView
            layers={layers}
            onMapReady={(m: MLMap) => (mapRef.current = m)}
          />
          {loading && (
            <div className="absolute bottom-4 left-4 z-[5] flex items-center gap-2 rounded-md border border-border bg-surface/90 px-3 py-1.5 text-xs backdrop-blur">
              <Spinner size="sm" />
              Loading…
            </div>
          )}
          {error && (
            <div className="absolute bottom-4 left-4 z-[5] rounded-md border border-danger/40 bg-surface/90 px-3 py-1.5 text-xs text-danger backdrop-blur">
              {error}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-px overflow-hidden border-l border-border bg-surface">
          <StatsBar stats={stats} />
          <TimelinePanel timeline={timeline} />
          <IncidentList
            features={features}
            selectedCountries={selectedCountries}
            onSelect={selectIncident}
            activeId={selectedIncident?.properties.id ?? null}
          />
        </aside>
      </main>

      <IncidentDrawer
        feature={selectedIncident}
        onClose={() => selectIncident(null)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  ariaLabel,
  selectedKey,
  onSelectionChange,
  width,
  children,
}: {
  label: string;
  ariaLabel: string;
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  width: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <Select
        aria-label={ariaLabel}
        selectedKey={selectedKey}
        onSelectionChange={(k) => onSelectionChange(String(k))}
        className={width}
      >
        <Select.Trigger className="h-7 rounded-md px-2 text-xs">
          <Select.Value />
          <Select.Indicator className="ml-auto text-muted">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Select.Indicator>
        </Select.Trigger>
        <Select.Popover className="max-h-[320px]">
          <ListBox>{children}</ListBox>
        </Select.Popover>
      </Select>
    </label>
  );
}

function toneColor(tone: number | null): [number, number, number, number] {
  if (tone == null) return [120, 120, 120, 180];
  const t = Math.max(-10, Math.min(10, tone));
  if (t < 0) {
    const r = 178;
    const g = Math.round(24 + (1 - Math.abs(t) / 10) * 100);
    const b = 43;
    return [r, g, b, 220];
  }
  return [33, 102, 172, 220];
}

function buildFeatureFromPoint(obj: Record<string, unknown>): IncidentFeature {
  const pos = (obj as { position: [number, number, number] }).position;
  const { position: _pos, ...props } = obj as { position: [number, number, number] } & Record<string, unknown>;
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [pos[0], pos[1]] },
    properties: props as IncidentFeature["properties"],
  };
}
