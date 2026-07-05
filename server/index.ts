import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getDb } from "./db.js";
import { runOnce } from "./ingest.js";
import { getActorCountry } from "./threatActors.js";
import type {
  CountryOption,
  IncidentFeatureCollection,
  SqlValue,
} from "../shared/types.js";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "0.0.0.0";
const SCHEDULE_MS = 15 * 60 * 1000;
const AUTO_INGEST = process.env.AUTO_INGEST !== "0";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");
await app.register(fastifyStatic, {
  root: distDir,
  prefix: "/",
  decorateReply: false,
});

interface QueryParams {
  since?: string;
  until?: string;
  country?: string;
  theme?: string;
  actor?: string;
  limit?: number;
}

function buildWhere(params: QueryParams): { clause: string; values: SqlValue[] } {
  const conditions: string[] = [];
  const values: SqlValue[] = [];
  if (params.since) {
    conditions.push("published_at >= ?");
    values.push(params.since);
  }
  if (params.until) {
    conditions.push("published_at <= ?");
    values.push(params.until);
  }
  if (params.country) {
    const codes = params.country.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    if (codes.length === 1) {
      conditions.push("victim_country_code = ?");
      values.push(codes[0]);
    } else if (codes.length > 1) {
      const placeholders = codes.map(() => "?").join(",");
      conditions.push(`victim_country_code IN (${placeholders})`);
      values.push(...codes);
    }
  }
  if (params.theme) {
    conditions.push("theme LIKE ?");
    values.push(`%${params.theme}%`);
  }
  if (params.actor) {
    conditions.push("actor LIKE ?");
    values.push(`%${params.actor}%`);
  }
  const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { clause, values };
}

app.get("/api/incidents", async (req) => {
  const q = (req.query ?? {}) as QueryParams;
  const { clause, values } = buildWhere(q);
  const limit = Math.min(Number(q.limit ?? 2000), 10000);

  const db = getDb();
  const stmt = db.prepare(
    `SELECT * FROM incidents ${clause}
     ORDER BY published_at DESC
     LIMIT ${limit}`
  );
  const rows = stmt.all(...values) as Array<Record<string, unknown>>;

  const fc: IncidentFeatureCollection = {
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.victim_lon as number, r.victim_lat as number] },
      properties: {
        id: r.id as number,
        actor: (r.actor as string) ?? null,
        actor_country: getActorCountry((r.actor as string) ?? null),
        victim_country: (r.victim_country as string) ?? null,
        victim_country_code: (r.victim_country_code as string) ?? null,
        source_country: (r.source_country as string) ?? null,
        tone: r.tone != null ? Number(r.tone) : null,
        theme: r.theme as string,
        url: r.url as string,
        title: (r.title as string) ?? null,
        domain: (r.domain as string) ?? null,
        language: (r.language as string) ?? null,
        published_at: r.published_at as string,
        ingested_at: r.ingested_at as string,
      },
    })),
  };
  return fc;
});

app.get("/api/countries", async () => {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT victim_country_code AS code,
            COALESCE(MAX(victim_country), 'Unknown') AS name,
            COUNT(*) AS count
     FROM incidents
     WHERE victim_country_code IS NOT NULL
     GROUP BY victim_country_code
     ORDER BY count DESC`
  );
  return stmt.all() as unknown as CountryOption[];
});

app.get("/api/actors", async (req) => {
  const q = (req.query ?? {}) as QueryParams;
  const { clause, values } = buildWhere(q);
  const actorCondition = "actor IS NOT NULL AND actor != ''";
  const whereClause = clause
    ? `${clause} AND ${actorCondition}`
    : `WHERE ${actorCondition}`;
  const db = getDb();
  const stmt = db.prepare(
    `SELECT actor AS name, COUNT(*) AS count
     FROM incidents
     ${whereClause}
     GROUP BY actor
     ORDER BY count DESC
     LIMIT 500`
  );
  return stmt.all(...values) as Array<{ name: string; count: number }>;
});

app.get("/api/themes", async (req) => {
  const q = (req.query ?? {}) as QueryParams;
  const { clause, values } = buildWhere(q);
  const db = getDb();
  const stmt = db.prepare(
    `SELECT theme FROM incidents ${clause}`
  );
  const rows = stmt.all(...values) as Array<{ theme: string }>;
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const t of r.theme.split(",")) {
      const trimmed = t.trim();
      if (!trimmed) continue;
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
});

app.get("/api/stats", async (req) => {
  const q = (req.query ?? {}) as QueryParams;
  const { clause, values } = buildWhere(q);
  const db = getDb();
  const stmt = db.prepare(
    `SELECT COUNT(*) AS total,
            COUNT(DISTINCT actor) AS actors,
            COUNT(DISTINCT victim_country_code) AS countries,
            MIN(published_at) AS from_ts,
            MAX(published_at) AS to_ts,
            AVG(tone) AS avg_tone
     FROM incidents ${clause}`
  );
  return stmt.get(...values) as {
    total: number;
    actors: number;
    countries: number;
    from_ts: string | null;
    to_ts: string | null;
    avg_tone: number | null;
  };
});

app.get("/api/timeline", async (req) => {
  const q = (req.query ?? {}) as QueryParams;
  const { clause, values } = buildWhere({
    since: q.since,
    until: q.until,
    country: q.country,
    theme: q.theme,
  });
  const db = getDb();
  const stmt = db.prepare(
    `SELECT substr(published_at,1,10) AS day,
            COUNT(*) AS count,
            AVG(tone) AS avg_tone
     FROM incidents ${clause}
     GROUP BY day
     ORDER BY day ASC`
  );
  return stmt.all(...values) as Array<{ day: string; count: number; avg_tone: number | null }>;
});

app.get("/api/stream", async (req, reply) => {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  reply.raw.write(`event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const interval = setInterval(() => {
    try {
      const db = getDb();
      const stmt = db.prepare(
        `SELECT * FROM incidents
         WHERE ingested_at >= datetime('now', '-2 minutes')
         ORDER BY ingested_at DESC LIMIT 50`
      );
      const latest = stmt.all();
      if (latest.length > 0) {
        reply.raw.write(`event: incidents\ndata: ${JSON.stringify(latest)}\n\n`);
      }
    } catch (err) {
      app.log.error({ err }, "sse poll failed");
    }
  }, 30000);

  req.raw.on("close", () => {
    clearInterval(interval);
    reply.raw.end();
  });
});

app.get("/api/ingest", async (req) => {
  const q = (req.query ?? {}) as { hours?: string };
  const hours = Number(q.hours) || 6;
  app.log.info({ hours }, "manual ingest triggered");
  setImmediate(async () => {
    try {
      await runOnce(hours);
    } catch (err) {
      app.log.error({ err }, "manual ingest failed");
    }
  });
  return { triggered: true, hours };
});

app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith("/api")) return reply.code(404).send({ error: "not found" });
  return reply.sendFile("index.html");
});

async function startScheduler() {
  if (!AUTO_INGEST) return;
  app.log.info("auto-ingest scheduler enabled");
  const tick = async () => {
    try {
      await runOnce(1);
    } catch (err) {
      app.log.error({ err }, "scheduled ingest failed");
    }
  };
  setTimeout(tick, 5000);
  setInterval(tick, SCHEDULE_MS);
}

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`server listening on ${HOST}:${PORT}`);
  startScheduler();
});
