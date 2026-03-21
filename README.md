# Threat Actor Globe

An interactive 3D wireframe globe visualizing **143 cyber threat actors** with geopolitical attribution, MITRE ATT&CK integration, and real-time filtering.

## Features

- **3D wireframe globe** with continent outlines (177 country polygons) and lat/lon graticule grid
- **143 threat actors** plotted by country of origin, color-coded and shape-coded by category
- **Cluster picker** — clicking a country with multiple actors (e.g. Russia: 50, China: 42) opens a searchable pop-up list
- **Unknown-origin actors** displayed as static satellite nodes around the globe
- **MITRE ATT&CK links** — direct group page links for actors with known IDs, search fallback for others
- **Full filter panel** — filter by category (APT, Ransomware, Crimeware, Hacktivist, Influence) and country of origin
- **Detail panel** — click any actor to see name, country, category, intelligence summary, and MITRE ATT&CK reference

## Coverage

| Country | Actors |
|---------|--------|
| Russia | 50 |
| China | 42 |
| Unknown | 16 |
| Iran | 14 |
| North Korea | 6 |
| Israel | 3 |
| India | 3 |
| Others | 9 |

## Categories

- **APT** (111) — Nation-state espionage groups
- **Ransomware** (20) — Financially motivated ransomware operators
- **Crimeware** (9) — Cybercriminal groups
- **Hacktivist** (2) — Ideologically motivated actors
- **Influence** (1) — Information operations

## Usage

Open `index.html` directly in any modern browser — no server or build step required. Fully self-contained single HTML file.

## Tech Stack

- [globe.gl](https://github.com/vasturiano/globe.gl) — 3D globe rendering
- Three.js (bundled via globe.gl)
- Vanilla HTML/CSS/JS — zero dependencies, no npm

## Data Sources

- Threat actor intelligence: ESET Research, public CTI reporting
- Continent outlines: Natural Earth GeoJSON
- MITRE ATT&CK group mappings: [attack.mitre.org/groups](https://attack.mitre.org/groups/)

---
*Created with [Perplexity Computer](https://www.perplexity.ai/computer)*
