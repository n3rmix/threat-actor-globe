import type { IncidentFeature } from "../../shared/types.js";

interface Props {
  feature: IncidentFeature;
  onClose: () => void;
}

export function IncidentDrawer({ feature, onClose }: Props) {
  const p = feature.properties;
  const published = new Date(p.published_at).toLocaleString();
  return (
    <aside className="drawer">
      <header className="drawer__header">
        <h3>{p.title ?? p.domain ?? "Untitled incident"}</h3>
        <button className="link-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <dl className="drawer__grid">
        <dt>Actor</dt>
        <dd>{p.actor ?? "Unknown / unattributed"}</dd>
        <dt>Country</dt>
        <dd>
          {p.victim_country ?? "—"}
          {p.victim_country_code ? ` (${p.victim_country_code})` : ""}
        </dd>
        <dt>Theme</dt>
        <dd><code>{p.theme}</code></dd>
        <dt>Published</dt>
        <dd>{published}</dd>
        <dt>Language</dt>
        <dd>{p.language ?? "—"}</dd>
        <dt>Source</dt>
        <dd>{p.domain ?? "—"}</dd>
        <dt>Tone</dt>
        <dd className={toneClass(p.tone)}>{p.tone != null ? p.tone.toFixed(2) : "—"}</dd>
      </dl>
      {p.url && (
        <a className="drawer__link" href={p.url} target="_blank" rel="noreferrer noopener">
          Open article ↗
        </a>
      )}
    </aside>
  );
}

function toneClass(t: number | null): string {
  if (t == null) return "";
  if (t < -3) return "drawer__tone-bad";
  return "";
}
