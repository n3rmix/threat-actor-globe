import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { inflateRawSync } from "node:zlib";
import { parse } from "csv-parse";
import { matchThreatActor } from "./threatActors.js";

export const GDELT_BASE = "http://data.gdeltproject.org/gdeltv2";
export const MASTER_FILELIST = `${GDELT_BASE}/masterfilelist.txt`;

export const CYBER_THEMES = new Set([
  "CYBER_ATTACK",
  "CYBER_SECURITY",
  "TAX_FNCACT_HACKER",
  "TAX_FNCACT_CYBERCRIMINAL",
  "GENERAL_GOVERNMENT_CYBERSECURITY",
  "CRIME_CYBERCRIME",
  "WB_2457_CYBER_CRIME",
]);

export const GEOPOLITICAL_THEMES = new Set([
  "MILITARY",
  "TERROR",
  "ARMEDCONFLICT",
  "KILL",
  "SANCTIONS",
  "REBELS",
  "COUP",
  "SEPARATISTS",
  "SECURITY_SERVICES",
  "BLOCKADE",
  "WB_678_CONFLICT_AND_VIOLENCE",
]);

export interface GkgRow {
  date: string;
  url: string;
  domain: string;
  title: string | null;
  language: string;
  themes: string[];
  locations: GkgLocation[];
  organizations: string[];
  persons: string[];
  tone: number | null;
}

export interface GkgLocation {
  name: string;
  lat: number;
  lon: number;
  featureCode: string;
  countryCode: string;
  admin1: string | null;
}

// GKG 2.5 column indices (0-indexed)
const COL = {
  DATE: 1,
  URL: 4,
  THEMES_V1: 7,
  THEMES_V2: 8,
  // V1Locations (col 9): Type#Name#Country#ADM1#Lat#Lon#FeatureID  (7 parts)
  // V2Locations (col 10): Type#Name#Country#ADM1#ADM2#Lat#Lon#FeatureID#GPE  (9 parts)
  LOCATIONS_V1: 9,
  LOCATIONS_V2: 10,
  PERSONS_V1: 11,
  PERSONS_V2: 12,
  ORGS_V1: 13,
  ORGS_V2: 14,
  TONE: 15,
  DATES: 16,
  GCAM: 17,
  ALL_NAMES: 23,
  AMOUNTS: 24,
  TRANSLATION: 25,
  EXTRAS: 26,
};

export async function fetchMasterFilelist(): Promise<
  Array<{ timestamp: string; type: "export" | "gkg" | "mentions"; url: string; size: number }>
> {
  const res = await fetch(MASTER_FILELIST);
  if (!res.ok) throw new Error(`masterfilelist ${res.status}`);
  const text = await res.text();
  const out: Array<{ timestamp: string; type: "export" | "gkg" | "mentions"; url: string; size: number }> = [];
  for (const line of text.trim().split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const sizeStr = parts[0];
    const url = parts[2];
    if (!url) continue;
    const m = url.match(/(\d{14})\.(export|gkg|mentions)\.[Cc][Ss][Vv]\.zip$/i);
    if (!m) continue;
    out.push({
      timestamp: m[1],
      type: m[2] as "export" | "gkg" | "mentions",
      url,
      size: Number(sizeStr),
    });
  }
  return out;
}

export async function fetchGkgZip(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch gkg ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const decompressed = extractFirstZipEntry(buf);
  return decompressed.toString("utf8");
}

function extractFirstZipEntry(buf: Buffer): Buffer {
  if (buf.length < 30 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
    throw new Error("not a zip archive");
  }
  const compressionMethod = buf.readUInt16LE(8);
  const compressedSize = buf.readUInt32LE(18);
  const filenameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const dataStart = 30 + filenameLen + extraLen;

  if (compressionMethod === 0) {
    return buf.subarray(dataStart, dataStart + compressedSize);
  }
  if (compressionMethod === 8) {
    const end = compressedSize > 0 ? dataStart + compressedSize : buf.length;
    return inflateRawSync(buf.subarray(dataStart, end));
  }
  throw new Error(`unsupported zip compression method ${compressionMethod}`);
}

export async function parseGkgStream(
  csvText: string,
  onRow: (row: GkgRow) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter: "\t",
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
    });

    const stream = Readable.from([csvText]);
    stream
      .pipe(parser)
      .on("data", (cols: string[]) => {
        if (cols.length < 16) return;

        const date = cols[COL.DATE] ?? "";
        const url = cols[COL.URL] ?? "";
        if (!url) return;

        // Themes: prefer V2 (index 8), fall back to V1 (index 7)
        const themesRaw = cols[COL.THEMES_V2] || cols[COL.THEMES_V1] || "";
        const themes = parseThemes(themesRaw);
        const hasCyberTheme = themes.some((t) => CYBER_THEMES.has(t));
        const hasGeoTheme = themes.some((t) => GEOPOLITICAL_THEMES.has(t));
        if (!hasCyberTheme && !hasGeoTheme) return;

        // Title: search EXTRAS (index 26) and AllNames (index 23) for PAGE_TITLE
        const title = findPageTitle(cols[COL.EXTRAS]) || findPageTitle(cols[COL.ALL_NAMES]);

        // Secondary content validation: GDELT's CYBER_ATTACK theme is very broad
        // and catches AI news, general crime, entertainment, etc. Require actual
        // cyber-incident signals in the title or URL. Geopolitical-themed rows
        // bypass this since they describe physical conflict events.
        if (hasCyberTheme && !isActualCyberIncident(title, url)) return;

        // Locations: prefer V1 (col 9) which has a simpler format:
        //   Type#Name#Country#ADM1#Lat#Lon#FeatureID
        // V2 (col 10) inserts an ADM2 field, shifting lat/lon by one position.
        const locationsRaw = cols[COL.LOCATIONS_V1] || cols[COL.LOCATIONS_V2] || "";
        const locations = parseLocations(locationsRaw);
        if (locations.length === 0) return;

        // Organizations: V1 (index 13) is semicolon-separated names,
        // V2 (index 14) is Name,Count;Name,Count; format
        const orgsV1 = cols[COL.ORGS_V1] || "";
        const orgsV2 = cols[COL.ORGS_V2] || "";
        const organizations = parseOrganizations(orgsV1, orgsV2);

        // Persons: V1 (index 11) is semicolon-separated names,
        // V2 (index 12) is Name,Count; format
        const personsV1 = cols[COL.PERSONS_V1] || "";
        const personsV2 = cols[COL.PERSONS_V2] || "";
        const persons = parseOrganizations(personsV1, personsV2);

        // Tone: index 15, comma-separated floats, first value is avg tone
        const toneRaw = cols[COL.TONE] || "";
        const tone = toneRaw ? Number(toneRaw.split(",")[0]) : null;

        // Translation info: index 25
        const translationInfo = cols[COL.TRANSLATION] || "";
        let language = "eng";
        if (translationInfo) {
          const m = translationInfo.match(/srclang:([a-z]+)/i);
          if (m) language = m[1].toLowerCase();
        }

        // Title already extracted above for content validation

        let domain: string;
        try {
          domain = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          domain = url;
        }

        onRow({
          date,
          url,
          domain,
          title,
          language,
          themes,
          locations,
          organizations,
          persons,
          tone,
        });
      })
      .on("error", reject)
      .on("end", resolve);
  });
}

function parseThemes(field: string): string[] {
  if (!field) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of field.split(";")) {
    // V2Themes format: THEME,OFFSET; V1Themes format: THEME;
    const name = entry.split(",")[0].trim();
    if (!name) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

function parseOrganizations(v1Field: string, v2Field: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  // V1 format: name;name;name
  for (const name of v1Field.split(";")) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  // V2 format: Name,Count;Name,Count;
  for (const entry of v2Field.split(";")) {
    const name = entry.split(",")[0].trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }

  return out;
}

function findPageTitle(field: string): string | null {
  if (!field) return null;
  const m = field.match(/<PAGE_TITLE>([^<]+)<\/PAGE_TITLE>/i);
  return m ? m[1].trim() : null;
}

// ── Cyber incident validation ───────────────────────────────────
// GDELT's CYBER_ATTACK theme is keyword-based and very broad — it catches
// AI news, deepfakes, general crime, anime, policy debates, etc.
// This function validates that an article is actually about a real cyber
// attack, breach, or security incident based on its title and URL.

const CYBER_INCIDENT_KEYWORDS = /\b(hack|hacke[dr]|hacking|breach|data breach|ransomware|ransom|malware|trojan|backdoor|botnet|phishing|phish|spearphishing|spear-phishing|cyberattack|cyber-attack|cyber attack|cybercrime|cyber-crime|cyber crime|cyberespionage|cyber-espionage|cyber espionage|cybersecurity|cyber-security|cyber security|compromis|exfiltrat|zero-day|zero day|0day|cve-\d|vulnerab|exploit|ddos|denial.of.service|credential.stuffing|sql.injection|supply.chain.attack|infrastructure.attack|dark.web|data.leak|data theft|information theft|identity.theft|spyware|keylogger|rootkit|wiper|scam|fraud|encrypt|lockbit|blackcat|alphv|cl0p|apt\d|threat.actor|threat.group|advanced.persistent.threat|indicators.of.compromise|ioc|c2.server|command.and.control|payload|implant|intrusion|unauthorized.access|deface|defacement|skimmer|magecart|cryptominer|cryptojacking|coinminer|botnet|c2|turncoat|rat\b|remote.access.trojan|info-stealer|infostealer|stealer|loader|dropper|steganography|living.off.the.land|lotl|lateral.movement|privilege.escalation|persistent|implant|beacon|cobalt.strike|metasploit|empire|sliver|brute.rag|bruteforce|brute-force|credential.harvest|password.spray|kerberoast|pass-the-hash|golden.ticket|shadow.credentials)\b/i;

const CYBER_EXCLUDE_KEYWORDS = /\b(anime|manga|deepfake.face.training|face.training|ai.model|openai|gpt|llm|qwen|gemini|claude|anthropic|ai.rollout|model.rollout|ai.firm|ai.startup|genai|generative.ai|text-to-image|text.to.image|ai.art|ai.generated|chatbot|virtual.assistant|voice.assistant|smart.speaker|smart.home|smart.tv|smartphone.review|iphone.review|gadget.review|tech.review|gaming|gameplay|game.review|esports|streaming.service|streaming.platform|netflix|spotify|disney|hulu|anime.lineup|season.\d|episode|soundtrack|cosplay|convention|expo|trade.show|car.review|car.model|electric.vehicle|ev\b|auto.show|motorcycle|boat.show|yacht|real.estate|property|housing.market|mortgage|insurance|guaranty.fund|insurer|loan|mortgage.rate|interest.rate|stock.market|crypto.price|bitcoin.price|ethereum|nft\b|crypto.trading|crypto.exchange|blockchain|web3|defi|metaverse|vr.headset|ar.glasses|wearable|fitness.tracker|smartwatch|recipe|restaurant|food.review|travel.guide|tourism|vacation|hotel.review|fashion|celebrity|gossip|entertainment|movie.review|film.festival|book.review|music.release|album.review|concert|festival.lineup|sports|nba|nfl|mlb|nhl|soccer|football|basketball|baseball|tennis|golf|olympic|championship|playoff|tournament|election|voting|ballot|campaign|polling|caucus|primary.election|gerrymander|redistricting|anime.convention|manga.release|light.novel)\b/i;

export function isActualCyberIncident(title: string | null, url: string): boolean {
  const text = `${title ?? ""} ${url}`.toLowerCase();

  // Must have at least one cyber-incident keyword in title or URL
  if (!CYBER_INCIDENT_KEYWORDS.test(text)) return false;

  // Exclude obvious non-incident content
  if (CYBER_EXCLUDE_KEYWORDS.test(text)) return false;

  return true;
}

export function parseLocations(field: string): GkgLocation[] {
  if (!field) return [];
  const out: GkgLocation[] = [];
  for (const entry of field.split(";")) {
    const parts = entry.split("#");
    if (parts.length < 6) continue;

    const name = parts[1];
    const countryCode = parts[2];
    const admin1 = parts[3] ?? null;

    // V1 format (7 parts): Type#Name#Country#ADM1#Lat#Lon#FeatureID
    // V2 format (9 parts): Type#Name#Country#ADM1#ADM2#Lat#Lon#FeatureID#GPE
    // If parts.length >= 8, it's V2 with an extra ADM2 field.
    let lat: number;
    let lon: number;
    if (parts.length >= 8) {
      lat = Number(parts[5]);
      lon = Number(parts[6]);
    } else {
      lat = Number(parts[4]);
      lon = Number(parts[5]);
    }

    if (!isFinite(lat) || !isFinite(lon)) continue;
    if (lat === 0 && lon === 0) continue;
    // Sanity check: lat must be [-90, 90], lon must be [-180, 180]
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

    const featureCode = parts.length >= 8 ? parts[7] : parts[6] ?? "";
    out.push({ name, lat, lon, featureCode, countryCode, admin1 });
  }
  return out;
}

export function pickPrimaryLocation(locs: GkgLocation[]): GkgLocation | null {
  return locs[0] ?? null;
}

export function pickActor(
  orgs: string[],
  persons: string[],
  title: string | null,
  url: string,
  domain: string | null
): string | null {
  const matched = matchThreatActor(orgs, persons, title, url, domain);
  if (matched) return matched.canonical;
  return null;
}

export function urlHash(url: string): string {
  return createHash("md5").update(url).digest("hex");
}
