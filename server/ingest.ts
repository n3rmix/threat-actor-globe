import { getDb, insertIncidents, type IncidentInsertRow } from "./db.js";
import {
  CYBER_THEMES,
  fetchGkgZip,
  fetchMasterFilelist,
  parseGkgStream,
  pickActor,
  pickPrimaryLocation,
  urlHash,
  type GkgRow,
} from "./gdelt.js";

const BACKFILL_HOURS = Number(process.env.BACKFILL_HOURS ?? 0);
const INGEST_SINCE_HOURS = Number(process.env.INGEST_SINCE_HOURS ?? 6);
const RATE_LIMIT_MS = 1200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ingestBatch(urls: string[], ts: string): Promise<{ inserted: number; status: "ok" | "not-ready" | "error" }> {
  const rows: IncidentInsertRow[] = [];
  let processed = 0;
  for (const url of urls) {
    try {
      const csv = await fetchGkgZip(url);
      await parseGkgStream(csv, (gkg: GkgRow) => {
        const loc = pickPrimaryLocation(gkg.locations);
        if (!loc) return;
        const actor = pickActor(gkg.organizations, gkg.persons, gkg.title, gkg.url, gkg.domain);
        const cyberThemes = gkg.themes.filter((t) => CYBER_THEMES.has(t));
        const theme = cyberThemes.length > 0 ? cyberThemes.join(",") : gkg.themes[0];

        rows.push({
          actor,
          victim_lat: loc.lat,
          victim_lon: loc.lon,
          victim_country: loc.name,
          victim_country_code: loc.countryCode,
          source_lat: null,
          source_lon: null,
          source_country: null,
          tone: gkg.tone,
          theme,
          url: gkg.url,
          title: gkg.title,
          domain: gkg.domain,
          language: gkg.language,
          published_at: gdeltTimeToIso(gkg.date),
          ingested_at: new Date().toISOString(),
          url_hash: urlHash(gkg.url),
        });
      });
      processed += 1;
    } catch (err) {
      const msg = (err as Error).message;
      if (/404/.test(msg)) {
        return { inserted: 0, status: "not-ready" };
      }
      console.error(`[ingest] failed ${url}:`, msg);
      return { inserted: 0, status: "error" };
    }
    await sleep(RATE_LIMIT_MS);
  }

  const inserted = rows.length > 0 ? insertIncidents(rows) : 0;
  console.info(
    `[ingest] ts=${ts} files=${processed} parsed_rows=${rows.length} inserted=${inserted}`
  );
  return { inserted, status: "ok" };
}

function gdeltTimeToIso(ts: string): string {
  const y = ts.slice(0, 4);
  const m = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const h = ts.slice(8, 10);
  const mi = ts.slice(10, 12);
  const s = ts.slice(12, 14);
  return `${y}-${m}-${d}T${h}:${mi}:${s}Z`;
}

function lastIngestedTimestamp(): string {
  const db = getDb();
  const row = db
    .prepare("SELECT MAX(published_at) AS max_ts FROM incidents")
    .get() as { max_ts: string | null } | undefined;
  return row?.max_ts ?? "19700101000000";
}

async function runOnce(lookbackHours: number): Promise<void> {
  const all = await fetchMasterFilelist();
  const cutoff = new Date(Date.now() - lookbackHours * 3600 * 1000);
  const cutoffTs = formatTs(cutoff);
  const lastTs = lastIngestedTimestamp();

  const gkgFiles = all
    .filter((f) => f.type === "gkg")
    .filter((f) => f.timestamp > cutoffTs && f.timestamp > lastTs)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  console.info(
    `[ingest] lookback=${lookbackHours}h cutoff=${cutoffTs} lastTs=${lastTs} gkg_files=${gkgFiles.length}`
  );

  if (gkgFiles.length === 0) {
    console.info("[ingest] nothing to do");
    return;
  }

  let skipped = 0;
  for (const f of gkgFiles) {
    const result = await ingestBatch([f.url], f.timestamp);
    // GDELT publishes files ~15-30 min after the timestamp.
    // Once we hit a 404, the remaining files aren't ready yet — stop.
    if (result.status === "not-ready") {
      skipped++;
      break;
    }
  }
  if (skipped > 0) {
    console.info("[ingest] stopped early — newer files not yet published by GDELT");
  }
}

function formatTs(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

async function main() {
  const args = process.argv.slice(2);
  const hoursArg = args.find((a) => a.startsWith("--hours="));
  const hours = hoursArg ? Number(hoursArg.split("=")[1]) : INGEST_SINCE_HOURS;

  const backfillArg = args.find((a) => a.startsWith("--backfill="));
  const backfill = backfillArg ? Number(backfillArg.split("=")[1]) : BACKFILL_HOURS;

  const totalHours = Math.max(hours, backfill || 0);
  console.info(`[ingest] starting lookback=${totalHours}h`);
  await runOnce(totalHours);
  console.info("[ingest] done");
}

const isMain = process.argv[1]?.endsWith("ingest.ts") || process.argv[1]?.endsWith("ingest");
if (isMain) {
  main().catch((err) => {
    console.error("[ingest] fatal:", err);
    process.exit(1);
  });
}

export { runOnce, ingestBatch };
