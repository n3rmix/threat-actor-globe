import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH ?? "data/incidents.db";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT,
      victim_lat REAL NOT NULL,
      victim_lon REAL NOT NULL,
      victim_country TEXT,
      victim_country_code TEXT,
      source_lat REAL,
      source_lon REAL,
      source_country TEXT,
      tone REAL,
      theme TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      domain TEXT,
      language TEXT,
      published_at TEXT NOT NULL,
      ingested_at TEXT NOT NULL,
      url_hash TEXT NOT NULL,
      UNIQUE(url_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_published
      ON incidents(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_incidents_country
      ON incidents(victim_country_code);
    CREATE INDEX IF NOT EXISTS idx_incidents_theme
      ON incidents(theme);
    CREATE INDEX IF NOT EXISTS idx_incidents_actor
      ON incidents(actor);
  `);

  dbInstance = db;
  return db;
}

export interface IncidentInsertRow {
  actor: string | null;
  victim_lat: number;
  victim_lon: number;
  victim_country: string | null;
  victim_country_code: string | null;
  source_lat: number | null;
  source_lon: number | null;
  source_country: string | null;
  tone: number | null;
  theme: string;
  url: string;
  title: string | null;
  domain: string | null;
  language: string | null;
  published_at: string;
  ingested_at: string;
  url_hash: string;
}

const INSERT_SQL = `
  INSERT OR IGNORE INTO incidents
    (actor, victim_lat, victim_lon, victim_country, victim_country_code,
     source_lat, source_lon, source_country, tone, theme,
     url, title, domain, language, published_at, ingested_at, url_hash)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export function insertIncidents(rows: IncidentInsertRow[]): number {
  const db = getDb();
  const stmt = db.prepare(INSERT_SQL);
  const tx = db.exec.bind(db, "BEGIN");
  let inserted = 0;
  db.exec("BEGIN");
  try {
    for (const r of rows) {
      const res = stmt.run(
        r.actor,
        r.victim_lat,
        r.victim_lon,
        r.victim_country,
        r.victim_country_code,
        r.source_lat,
        r.source_lon,
        r.source_country,
        r.tone,
        r.theme,
        r.url,
        r.title,
        r.domain,
        r.language,
        r.published_at,
        r.ingested_at,
        r.url_hash
      );
      if (res.changes > 0) inserted += 1;
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  void tx;
  return inserted;
}
