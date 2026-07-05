export interface Incident {
  id: number;
  actor: string | null;
  actor_country: string | null;
  victim_lat: number;
  victim_lon: number;
  victim_country: string | null;
  victim_country_code: string | null;
  tone: number | null;
  theme: string;
  url: string;
  title: string | null;
  domain: string | null;
  language: string | null;
  published_at: string;
  ingested_at: string;
}

export interface IncidentFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Omit<Incident, "victim_lat" | "victim_lon">;
}

export interface IncidentFeatureCollection {
  type: "FeatureCollection";
  features: IncidentFeature[];
}

export interface CountryOption {
  code: string;
  name: string;
  count: number;
}

export interface IncidentQuery {
  since?: string;
  until?: string;
  country?: string;
  theme?: string;
  actor?: string;
  limit?: number;
}

export type SqlValue = string | number | bigint | null | Uint8Array;
