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

const LOOKBACK_DAYS_DEFAULT = 7;

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
    <div className="app">
      <header className="app__header">
        <h1>Threat Actor Globe</h1>
        <span className="app__subtitle">GDELT live cyber-activity monitor</span>
        <div className="app__controls">
          <label>
            Lookback
            <select value={lookbackDays} onChange={(e) => setLookbackDays(Number(e.target.value))}>
              <option value={1}>24h</option>
              <option value={3}>3d</option>
              <option value={7}>7d</option>
              <option value={14}>14d</option>
              <option value={30}>30d</option>
            </select>
          </label>
          <label>
            Theme
            <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}>
              <option value="">All ({features.length})</option>
              {themes.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.count})
                </option>
              ))}
            </select>
          </label>
          <label>
            Actor
            <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
              <option value="">All</option>
              {actors.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} ({a.count})
                </option>
              ))}
            </select>
          </label>
          <button onClick={loadAll} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <main className="app__main">
        <CountryFilter
          countries={countries}
          selected={selectedCountries}
          onToggle={toggleCountry}
          onClear={clearCountries}
          onFit={(bounds: [[number, number], [number, number]]) =>
            mapRef.current?.fitBounds(bounds, { padding: 40 })
          }
        />

        <div className="app__globe">
          <GlobeView
            layers={layers}
            onMapReady={(m: MLMap) => (mapRef.current = m)}
          />
          {error && <div className="app__error">{error}</div>}
          {loading && <div className="app__loading">Loading…</div>}
        </div>

        <aside className="app__side">
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

      {selectedIncident && (
        <IncidentDrawer
          feature={selectedIncident}
          onClose={() => selectIncident(null)}
        />
      )}
    </div>
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
