export interface ThreatActorEntry {
  canonical: string;
  aliases: string[];
  country: string;
  category: "APT" | "Ransomware" | "Crimeware" | "Hacktivist" | "Influence";
}

export const THREAT_ACTORS: ThreatActorEntry[] = [
  { canonical: "APT28 (Fancy Bear)", aliases: ["apt28", "fancy bear", "strontium", "sofacy", "forest blizzard", "pawn storm", "sednit", "tsar team"], country: "RU", category: "APT" },
  { canonical: "APT29 (Cozy Bear)", aliases: ["apt29", "cozy bear", "the dukes", "novellite", "midnight blizzard", "noblebaron", "starfraud"], country: "RU", category: "APT" },
  { canonical: "APT33 (Elfin)", aliases: ["apt33", "elfin", "refined kitten", "peach sandstorm"], country: "IR", category: "APT" },
  { canonical: "APT34 (OilRig)", aliases: ["apt34", "oilrig", "helix kitten", "iridium"], country: "IR", category: "APT" },
  { canonical: "APT35 (Charming Kitten)", aliases: ["apt35", "charming kitten", "phosphorus", "mint sandstorm", "newsbeef"], country: "IR", category: "APT" },
  { canonical: "APT36 (Transparent Tribe)", aliases: ["apt36", "transparent tribe", "projectm", "mythic leopard"], country: "PK", category: "APT" },
  { canonical: "APT37 (Reaper)", aliases: ["apt37", "reaper", "group123", "scarab", "temp.reaper"], country: "KP", category: "APT" },
  { canonical: "APT38 (Lazarus)", aliases: ["apt38", "lazarus", "lazarus group", "hidden cobra", "guardians of peace", "zinc", "diamond slede", "tempest"], country: "KP", category: "APT" },
  { canonical: "APT39 (Chafer)", aliases: ["apt39", "chafer", "remix kit"], country: "IR", category: "APT" },
  { canonical: "APT41 (Winnti)", aliases: ["apt41", "winnti", "barium", "wicked panda", "doppelpaymer"], country: "CN", category: "APT" },
  { canonical: "APT43 (Kimsuky)", aliases: ["apt43", "kimsuky", "thallium", "velvet chollima", "emissary panda"], country: "KP", category: "APT" },
  { canonical: "Sandworm", aliases: ["sandworm", "sandworm team", "voodoo bear", "iridiu", "seaborgium", "cadet blizzard"], country: "RU", category: "APT" },
  { canonical: "Gamaredon", aliases: ["gamaredon", "primitive bear", "actinium", "shuckworm", "armageddon"], country: "RU", category: "APT" },
  { canonical: "Turla", aliases: ["turla", "snake", "waterbug", "venomous bear", "krypton", "penguin turla"], country: "RU", category: "APT" },
  { canonical: "FancyBear", aliases: ["fancy bear", "apt28", "strontium"], country: "RU", category: "APT" },
  { canonical: "Mustang Panda", aliases: ["mustang panda", "bronze president", "red_delta", "twelver", "earth berebus"], country: "CN", category: "APT" },
  { canonical: "Evasive Panda", aliases: ["evasive panda", "bronze highland", "daggerfly", "stormbamboo"], country: "CN", category: "APT" },
  { canonical: "FishMonger (Earth Lusca)", aliases: ["fishmonger", "earth lusca", "aquatic panda", "tag22", "red dev 10"], country: "CN", category: "APT" },
  { canonical: "Naikon", aliases: ["naikon", "override panda", "daggerfly"], country: "CN", category: "APT" },
  { canonical: "Patchwork (Dropping Elephant)", aliases: ["patchwork", "dropping elephant", "monsoon", "confucius"], country: "IN", category: "APT" },
  { canonical: "SideWinder", aliases: ["sidewinder", "razor tiger", "t-apt-04", "rattle snake"], country: "IN", category: "APT" },
  { canonical: "DoNot Team", aliases: ["do not team", "donot team", "aptc35", "sectore02"], country: "IN", category: "APT" },
  { canonical: "DarkHotel", aliases: ["dark hotel", "luder"], country: "KR", category: "APT" },
  { canonical: "WinterVivern", aliases: ["winter vivern", "wintervivern", "ta473"], country: "UA", category: "APT" },
  { canonical: "SturgeonPhisher (YoroTrooper)", aliases: ["sturgeon phisher", "yorotrooper", "sturgeonphisher"], country: "KZ", category: "APT" },
  { canonical: "MuddyWater", aliases: ["muddy water", "muddywater", "mercury", "static kitten", "mango sandstorm"], country: "IR", category: "APT" },
  { canonical: "Domestic Kitten", aliases: ["domestic kitten", "apt-c-50"], country: "IR", category: "APT" },
  { canonical: "Lyceum (Hexane)", aliases: ["lyceum", "hexane", "spirlin"], country: "IR", category: "APT" },
  { canonical: "Pioneer Kitten", aliases: ["pioneer kitten", "apt35", "fox kitten", "dev-027"], country: "IR", category: "APT" },
  { canonical: "Scattered Spider", aliases: ["scattered spider", "octo tempest", "0ktapus"], country: "US", category: "Crimeware" },
  { canonical: "Volt Typhoon", aliases: ["volt typhoon", "bronze silhouette", "insidious taurus", "vanguard panda"], country: "CN", category: "APT" },
  { canonical: "Salt Typhoon", aliases: ["salt typhoon", "ghost emperor"], country: "CN", category: "APT" },
  { canonical: "Flax Typhoon", aliases: ["flax typhoon", "ethereal panda"], country: "CN", category: "APT" },
  { canonical: "Nova Lizzard", aliases: ["nova lizzard"], country: "RU", category: "APT" },
  { canonical: "Cadet Blizzard", aliases: ["cadet blizzard"], country: "RU", category: "APT" },
  { canonical: "Forest Blizzard", aliases: ["forest blizzard", "apt28"], country: "RU", category: "APT" },
  { canonical: "Seaborgium", aliases: ["seaborgium", "callisto group", "tabloo"], country: "RU", category: "APT" },
  { canonical: "Star Blizzard", aliases: ["star blizzard", "callisto", "colbalt darkness"], country: "RU", category: "APT" },
  { canonical: "Midnight Blizzard", aliases: ["midnight blizzard", "apt29", "noblebaron"], country: "RU", category: "APT" },
  { canonical: "Mint Sandstorm", aliases: ["mint sandstorm", "apt35", "charming kitten"], country: "IR", category: "APT" },
  { canonical: "Peach Sandstorm", aliases: ["peach sandstorm", "apt33", "elfin"], country: "IR", category: "APT" },
  { canonical: "Cotton Sandstorm", aliases: ["cotton sandstorm", "apt34", "oilrig"], country: "IR", category: "APT" },

  // Ransomware operators
  { canonical: "LockBit", aliases: ["lockbit", "lock bit", "lockbitgold", "lockbit 3.0", "lockbitblack"], country: "RU", category: "Ransomware" },
  { canonical: "ALPHV (BlackCat)", aliases: ["alphv", "blackcat", "black cat ransomware", "noberus"], country: "RU", category: "Ransomware" },
  { canonical: "Cl0p", aliases: ["cl0p", "clop", "crypto", "fin11", "ta505"], country: "RU", category: "Ransomware" },
  { canonical: "Black Basta", aliases: ["black basta"], country: "RU", category: "Ransomware" },
  { canonical: "Royal (BlackSuit)", aliases: ["royal ransomware", "blacksuit", "royal group"], country: "RU", category: "Ransomware" },
  { canonical: "Play", aliases: ["play ransomware", "play group", "playcrypt"], country: "RU", category: "Ransomware" },
  { canonical: "Akira", aliases: ["akira ransomware"], country: "RU", category: "Ransomware" },
  { canonical: "Rhysida", aliases: ["rhysida"], country: "RU", category: "Ransomware" },
  { canonical: "Cuba", aliases: ["cuba ransomware", "cuba group"], country: "RU", category: "Ransomware" },
  { canonical: "Vice Society", aliases: ["vice society"], country: "RU", category: "Ransomware" },
  { canonical: "Medusa", aliases: ["medusa ransomware", "medusa locker"], country: "RU", category: "Ransomware" },
  { canonical: "BianLian", aliases: ["bianlian"], country: "RU", category: "Ransomware" },
  { canonical: "8Base", aliases: ["8base"], country: "RU", category: "Ransomware" },
  { canonical: "Hunters International", aliases: ["hunters international", "huntersintl"], country: "RU", category: "Ransomware" },
  { canonical: "Qilin (Agenda)", aliases: ["qilin", "agenda ransomware"], country: "RU", category: "Ransomware" },
  { canonical: "NoEscape", aliases: ["noescape"], country: "RU", category: "Ransomware" },
  { canonical: "Snatch", aliases: ["snatch ransomware", "snatch group"], country: "RU", category: "Ransomware" },
  { canonical: "Cactus", aliases: ["cactus ransomware"], country: "RU", category: "Ransomware" },
  { canonical: "Trigona", aliases: ["trigona"], country: "RU", category: "Ransomware" },
  { canonical: "Conti", aliases: ["conti ransomware", "conti group"], country: "RU", category: "Ransomware" },
  { canonical: "REvil (Sodinokibi)", aliases: ["revil", "sodinokibi", "sodin", "gold southfield"], country: "RU", category: "Ransomware" },
  { canonical: "DarkSide", aliases: ["darkside", "dark side", "blackmatter"], country: "RU", category: "Ransomware" },
  { canonical: "AvosLocker", aliases: ["avos locker", "avoslocker"], country: "US", category: "Ransomware" },
  { canonical: "Hive", aliases: ["hive ransomware", "hive group"], country: "RU", category: "Ransomware" },
  { canonical: "BlackMatter", aliases: ["blackmatter", "darkside"], country: "RU", category: "Ransomware" },
  { canonical: "Yanluowang", aliases: ["yanluowang"], country: "CN", category: "Ransomware" },
  { canonical: "Clop", aliases: ["clop", "cl0p", "ta505", "fin11"], country: "RU", category: "Ransomware" },
  { canonical: "RansomHub", aliases: ["ransomhub"], country: "RU", category: "Ransomware" },
  { canonical: "INC Ransom", aliases: ["inc ransom", "incredible"], country: "RU", category: "Ransomware" },
  { canonical: "Dagon Locker", aliases: ["dagon locker"], country: "RU", category: "Ransomware" },
  { canonical: "Babuk", aliases: ["babuk", "vapor locker"], country: "RU", category: "Ransomware" },
  { canonical: "Avaddon", aliases: ["avaddon"], country: "RU", category: "Ransomware" },
  { canonical: "Maze", aliases: ["maze ransomware", "maze group"], country: "RU", category: "Ransomware" },
  { canonical: "Egregor", aliases: ["egregor"], country: "RU", category: "Ransomware" },
  { canonical: "Ryuk", aliases: ["ryuk", "cont"], country: "RU", category: "Ransomware" },
  { canonical: "Hafnium", aliases: ["hafnium", "silk typhoon"], country: "CN", category: "APT" },
  { canonical: "Voltzite", aliases: ["voltzite", "apt10", "menu pass", "stone panda"], country: "CN", category: "APT" },
  { canonical: "Gallium", aliases: ["gallium", "apt41", "alloy taurus"], country: "CN", category: "APT" },

  // Hacktivists
  { canonical: "KillNet", aliases: ["killnet", "kill net"], country: "RU", category: "Hacktivist" },
  { canonical: "NoName057(16)", aliases: ["noname057", "noname 057", "noname057(16)"], country: "RU", category: "Hacktivist" },
  { canonical: "CyberBerkut", aliases: ["cyberberkut", "cyber berkut"], country: "RU", category: "Hacktivist" },
  { canonical: "Anonymous Sudan", aliases: ["anonymous sudan", "anon sudan"], country: "RU", category: "Hacktivist" },
  { canonical: "IT Army of Ukraine", aliases: ["it army of ukraine", "it army"], country: "UA", category: "Hacktivist" },
  { canonical: "CyberAv3ngers", aliases: ["cyberav3ngers", "cyber av3ngers", "cyber avengers"], country: "IR", category: "Hacktivist" },
  { canonical: "CyberVolk", aliases: ["cybervolk", "cyber volk"], country: "RU", category: "Hacktivist" },
  { canonical: "AnonSudan", aliases: ["anonsudan"], country: "RU", category: "Hacktivist" },
  { canonical: "GhostSec", aliases: ["ghostsec", "ghost sec"], country: "RU", category: "Hacktivist" },

  // Chinese APTs (Storm naming)
  { canonical: "StormBamboo", aliases: ["storm bamboo", "stormbamboo", "evasive panda", "daggerfly"], country: "CN", category: "APT" },
  { canonical: "StormCloud", aliases: ["storm cloud", "stormcloud"], country: "CN", category: "APT" },
  { canonical: "Storm-0551", aliases: ["storm-0551", "storm 0551"], country: "CN", category: "APT" },
  { canonical: "Storm-0919", aliases: ["storm-0919", "storm 0919"], country: "CN", category: "APT" },
  { canonical: "Goblin Panda", aliases: ["goblin panda", "cycldek", "concordia"], country: "CN", category: "APT" },
  { canonical: "Iron Tiger", aliases: ["iron tiger", "apt27", "emissary panda", "luckymouse", "iron taurus"], country: "CN", category: "APT" },
  { canonical: "Leviathan (TEMP.Periscope)", aliases: ["leviathan", "temp periscope", "temp jumper", "kaapco"], country: "CN", category: "APT" },
  { canonical: "Gelsemium", aliases: ["gelsemium"], country: "CN", category: "APT" },
  { canonical: "BackdoorDiplomacy", aliases: ["backdoor diplomacy", "backdoordiplomacy"], country: "CN", category: "APT" },
  { canonical: "Earth Kitsune", aliases: ["earth kitsune"], country: "CN", category: "APT" },
  { canonical: "CloudSnooper", aliases: ["cloud snooper", "cloudsnooper"], country: "CN", category: "APT" },
  { canonical: "NightDragon", aliases: ["night dragon", "nightdragon"], country: "CN", category: "APT" },
  { canonical: "Turbine Panda", aliases: ["turbine panda", "apt21"], country: "CN", category: "APT" },
  { canonical: "Sneaky Kestrel", aliases: ["sneaky kestrel"], country: "CN", category: "APT" },
  { canonical: "ChamelGang", aliases: ["chamelgang", "chamelg"], country: "CN", category: "APT" },

  // Russian/Other APTs
  { canonical: "Indrik Spider", aliases: ["indrik spider", "evil corp"], country: "RU", category: "Crimeware" },
  { canonical: "Inception", aliases: ["inception", "inception framework"], country: "RU", category: "APT" },
  { canonical: "DarkHydrus", aliases: ["darkhydrus", "dark hydrus"], country: "RU", category: "APT" },
  { canonical: "Magnet Goblin", aliases: ["magnet goblin"], country: "RU", category: "Crimeware" },
  { canonical: "Ember Bear", aliases: ["ember bear", "unc2589"], country: "RU", category: "APT" },
  { canonical: "Cinnamon Tempest", aliases: ["cinnamon tempest", "hive0117"], country: "RU", category: "Crimeware" },
  { canonical: "Cotton Tempest", aliases: ["cotton tempest", "qilin"], country: "RU", category: "Ransomware" },
  { canonical: "Vanilla Tempest", aliases: ["vanilla tempest", "vice society"], country: "RU", category: "Ransomware" },
  { canonical: "Manatee Tempest", aliases: ["manatee tempest", "ta577"], country: "RU", category: "Crimeware" },
  { canonical: "Pumpkin Eclipse", aliases: ["pumpkin eclipse"], country: "RU", category: "Crimeware" },
  { canonical: "Sapphire Sleet", aliases: ["sapphire sleet", "storm-1811", "coldriver"], country: "RU", category: "APT" },
  { canonical: "Diamond Sleet", aliases: ["diamond sleet", "zinc", "lazarus"], country: "KP", category: "APT" },
  { canonical: "Ruby Sleet", aliases: ["ruby sleet", "copperhail"], country: "KP", category: "APT" },
  { canonical: "Emerald Sleet", aliases: ["emerald sleet", "thallium", "kimsuky"], country: "KP", category: "APT" },
  { canonical: "Moonstone Sleet", aliases: ["moonstone sleet", "storm-1789"], country: "KP", category: "APT" },
  { canonical: "Jade Sleet", aliases: ["jade sleet", "dreamjob"], country: "KP", category: "APT" },
  { canonical: "Diamond Sleet", aliases: ["diamond sleet", "zinc", "lazarus"], country: "KP", category: "APT" },
  { canonical: "Citrine Sleet", aliases: ["citrine sleet", "scarcruft", "reaper"], country: "KP", category: "APT" },
  { canonical: "Onyx Sleet", aliases: ["onyx sleet", "plutonium"], country: "KP", category: "APT" },
  { canonical: "Stonefly", aliases: ["stonefly", "apt37", "temp reaper"], country: "KP", category: "APT" },
  { canonical: "Konni", aliases: ["konni", "konni apt"], country: "KP", category: "APT" },
  { canonical: "Black Banshee", aliases: ["black banshee"], country: "KP", category: "APT" },
  { canonical: "Kimsuky", aliases: ["kimsuky", "thallium", "emerald sleet"], country: "KP", category: "APT" },
  { canonical: "Lazarus Group", aliases: ["lazarus", "lazarus group", "hidden cobra", "apt38", "guardians of peace", "whois team", "zinc", "diamond sleet", "tempest"], country: "KP", category: "APT" },
  { canonical: "Andariel", aliases: ["andariel", "silent chollima", "stonefly"], country: "KP", category: "APT" },
  { canonical: "BlueNoroff", aliases: ["bluenoroff", "apt38", "stardust chollima"], country: "KP", category: "APT" },
  { canonical: "BeagleBoyz", aliases: ["beagle boyz", "nickete hydra"], country: "KP", category: "APT" },

  // Influence operations
  { canonical: "Doppelganger", aliases: ["doppelganger", "doppelganger russia"], country: "RU", category: "Influence" },
  { canonical: "RRN (Reliable Russian News)", aliases: ["rrn", "reliable russian news"], country: "RU", category: "Influence" },
  { canonical: "CopyCop", aliases: ["copycop", "copy cop"], country: "RU", category: "Influence" },
  { canonical: "Cyber Front R", aliases: ["cyber front russia", "cyber front r"], country: "RU", category: "Influence" },
  { canonical: "DARVO", aliases: ["darvo"], country: "RU", category: "Influence" },
  { canonical: "MetaForce", aliases: ["metaforce"], country: "IR", category: "Influence" },

  // Iran crimeware/proxy
  { canonical: "CyberAv3ngers", aliases: ["cyberav3ngers", "cyber av3ngers"], country: "IR", category: "Hacktivist" },
  { canonical: "CyberToufan", aliases: ["cybertoufan", "cyber toufan"], country: "IR", category: "Hacktivist" },
  { canonical: "Soldiers of Solomon", aliases: ["soldiers of solomon"], country: "IR", category: "Hacktivist" },

  // Israel
  { canonical: "Candiru", aliases: ["candiru", "devils tunat", "lebanon cedar"], country: "IL", category: "APT" },
  { canonical: "QuaDream", aliases: ["quadream"], country: "IL", category: "APT" },
  { canonical: "Predator", aliases: ["predator spyware", "intellexa"], country: "IL", category: "APT" },
  { canonical: "Pegasus (NSO Group)", aliases: ["pegasus", "nso group"], country: "IL", category: "APT" },

  // Misc crimeware
  { canonical: "FIN7", aliases: ["fin7", "carbanak", "navigator"], country: "RU", category: "Crimeware" },
  { canonical: "FIN8", aliases: ["fin8", "syssphinx"], country: "RU", category: "Crimeware" },
  { canonical: "FIN11", aliases: ["fin11", "cl0p", "ta505"], country: "RU", category: "Crimeware" },
  { canonical: "FIN12", aliases: ["fin12", "hive"], country: "RU", category: "Crimeware" },
  { canonical: "FIN13", aliases: ["fin13", "xorstructor"], country: "RU", category: "Crimeware" },
  { canonical: "TA505", aliases: ["ta505", "cl0p", "fin11"], country: "RU", category: "Crimeware" },
  { canonical: "TA551", aliases: ["ta551", "shathak"], country: "RU", category: "Crimeware" },
  { canonical: "TA542", aliases: ["ta542", "ursnif"], country: "RU", category: "Crimeware" },
  { canonical: "TA544", aliases: ["ta544", "bamboobot"], country: "RU", category: "Crimeware" },
  { canonical: "TA558", aliases: ["ta558"], country: "RU", category: "Crimeware" },
  { canonical: "TA571", aliases: ["ta571", "shadowpad"], country: "RU", category: "Crimeware" },
  { canonical: "ShinyHunters", aliases: ["shiny hunters", "shinyhunters"], country: "RU", category: "Crimeware" },
  { canonical: "FIN8", aliases: ["fin8", "syssphinx"], country: "RU", category: "Crimeware" },
  { canonical: "UNC2452", aliases: ["unc2452", "noblebaron", "midnight blizzard"], country: "RU", category: "APT" },
  { canonical: "UNC2589", aliases: ["unc2589", "ember bear"], country: "RU", category: "APT" },
  { canonical: "UNC3236", aliases: ["unc3236", "voltzite", "apt10"], country: "CN", category: "APT" },
  { canonical: "Hive0117", aliases: ["hive0117", "cinnamon tempest"], country: "RU", category: "Crimeware" },
];

// Build a lookup map: lowercase alias -> canonical entry
const ACTOR_LOOKUP = new Map<string, ThreatActorEntry>();
for (const actor of THREAT_ACTORS) {
  for (const alias of actor.aliases) {
    ACTOR_LOOKUP.set(alias.toLowerCase(), actor);
  }
  ACTOR_LOOKUP.set(actor.canonical.toLowerCase(), actor);
}

export function matchThreatActor(
  orgs: string[],
  persons: string[],
  title: string | null,
  url: string,
  domain: string | null
): ThreatActorEntry | null {
  const haystack = [
    ...orgs,
    ...persons,
    title ?? "",
    url ?? "",
    domain ?? "",
  ].join(" ").toLowerCase();

  if (!haystack.trim()) return null;

  const cyberContext = /\b(ransomware|cyber|hack|apt[ ]?\d|spyware|malware|phish|breach|exploit|vulnerab|backdoor|trojan|botnet|data leak|encrypt|threat actor|attack|campaign|target|infrastructure|supply chain|zero[ -]?day|cve[ -]?\d|apt|group|operator|cluster|cluster|activity)\b/i;

  // Check each alias against the combined text
  for (const [alias, entry] of ACTOR_LOOKUP) {
    // Word-boundary match to avoid false positives (e.g. "reaper" matching inside "preacher")
    const re = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
    if (!re.test(haystack)) continue;

    // Generic-word aliases require cyber context to avoid false positives
    // (e.g. "Predator" in "sexual predator", "Cuba" in a tourism article, "Royal" in royal family)
    const isGenericWord = GENERIC_WORD_ALIASES.has(alias);
    if (isGenericWord && !cyberContext.test(haystack)) {
      continue;
    }

    return entry;
  }

  return null;
}

// Aliases that are common English words — need cyber context to match
const GENERIC_WORD_ALIASES = new Set([
  "predator", "cuba", "royal", "play", "akira", "medusa", "cactus",
  "snatch", "conti", "maze", "hive", "naikon", "reaper", "hexane",
  "elfin", "chafer", "leviathan", "inception", "stonefly",
]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
