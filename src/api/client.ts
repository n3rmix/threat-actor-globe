import type {
  CountryOption,
  IncidentFeatureCollection,
} from "../../shared/types.js";

const BASE = "/api";

export async function fetchIncidents(params: {
  country?: string | string[];
  since?: string;
  until?: string;
  theme?: string;
  actor?: string;
  limit?: number;
}): Promise<IncidentFeatureCollection> {
  const url = new URL(`${BASE}/incidents`, window.location.origin);
  const country = Array.isArray(params.country) ? params.country.join(",") : params.country;
  if (country) url.searchParams.set("country", country);
  if (params.since) url.searchParams.set("since", params.since);
  if (params.until) url.searchParams.set("until", params.until);
  if (params.theme) url.searchParams.set("theme", params.theme);
  if (params.actor) url.searchParams.set("actor", params.actor);
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`incidents ${res.status}`);
  return res.json();
}

export async function fetchCountries(): Promise<CountryOption[]> {
  const res = await fetch(`${BASE}/countries`);
  if (!res.ok) throw new Error(`countries ${res.status}`);
  return res.json();
}

export async function fetchActors(params?: {
  since?: string;
  country?: string | string[];
  theme?: string;
}): Promise<Array<{ name: string; count: number }>> {
  const url = new URL(`${BASE}/actors`, window.location.origin);
  if (params?.since) url.searchParams.set("since", params.since);
  const country = Array.isArray(params?.country) ? params!.country.join(",") : params?.country;
  if (country) url.searchParams.set("country", country);
  if (params?.theme) url.searchParams.set("theme", params.theme);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`actors ${res.status}`);
  return res.json();
}

export async function fetchThemes(params?: {
  since?: string;
  country?: string | string[];
}): Promise<Array<{ name: string; count: number }>> {
  const url = new URL(`${BASE}/themes`, window.location.origin);
  if (params?.since) url.searchParams.set("since", params.since);
  const country = Array.isArray(params?.country) ? params!.country.join(",") : params?.country;
  if (country) url.searchParams.set("country", country);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`themes ${res.status}`);
  return res.json();
}

export async function fetchStats(params: {
  country?: string | string[];
  since?: string;
  until?: string;
  theme?: string;
  actor?: string;
}) {
  const url = new URL(`${BASE}/stats`, window.location.origin);
  const country = Array.isArray(params.country) ? params.country.join(",") : params.country;
  if (country) url.searchParams.set("country", country);
  if (params.since) url.searchParams.set("since", params.since);
  if (params.until) url.searchParams.set("until", params.until);
  if (params.theme) url.searchParams.set("theme", params.theme);
  if (params.actor) url.searchParams.set("actor", params.actor);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return res.json() as Promise<{
    total: number;
    actors: number;
    countries: number;
    from_ts: string | null;
    to_ts: string | null;
    avg_tone: number | null;
  }>;
}

export async function fetchTimeline(params: {
  country?: string | string[];
  since?: string;
  until?: string;
  theme?: string;
}) {
  const url = new URL(`${BASE}/timeline`, window.location.origin);
  const country = Array.isArray(params.country) ? params.country.join(",") : params.country;
  if (country) url.searchParams.set("country", country);
  if (params.since) url.searchParams.set("since", params.since);
  if (params.until) url.searchParams.set("until", params.until);
  if (params.theme) url.searchParams.set("theme", params.theme);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`timeline ${res.status}`);
  return res.json() as Promise<
    Array<{ day: string; count: number; avg_tone: number | null }>
  >;
}

export function subscribeToStream(
  onUpdate: (rows: Array<Record<string, unknown>>) => void
): () => void {
  const es = new EventSource(`${BASE}/stream`);
  es.addEventListener("incidents", (ev) => {
    try {
      onUpdate(JSON.parse(ev.data));
    } catch {
      /* ignore */
    }
  });
  return () => es.close();
}
