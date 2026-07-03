import { useRef } from "react";
import type { IncidentFeature } from "../../shared/types.js";
import { Drawer, Chip, Link } from "@heroui/react";

interface Props {
  feature: IncidentFeature | null;
  onClose: () => void;
}

export function IncidentDrawer({ feature, onClose }: Props) {
  // Keep the last non-null feature so the content stays valid during the
  // exit transition after `feature` flips back to null.
  const displayed = useRef<IncidentFeature | null>(null);
  if (feature) displayed.current = feature;
  const f = displayed.current;

  return (
    <Drawer
      isOpen={!!feature}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop variant="blur" />
      <Drawer.Content
        placement="right"
        className="w-[380px] max-w-[calc(100vw-2rem)] bg-surface text-foreground"
      >
        <Drawer.Dialog>
          {f && (
            <>
              <Drawer.Header className="flex items-start justify-between gap-3 border-b border-border pb-3">
                <Drawer.Heading className="m-0 text-sm leading-snug text-foreground">
                  {f.properties.title ?? f.properties.domain ?? "Untitled incident"}
                </Drawer.Heading>
                <Drawer.CloseTrigger
                  aria-label="Close"
                  className="text-muted transition-colors hover:text-foreground"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body className="py-3">
                <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
                  <Detail label="Actor">
                    {f.properties.actor ?? (
                      <span className="text-muted">Unknown / unattributed</span>
                    )}
                  </Detail>
                  <Detail label="Country">
                    {f.properties.victim_country ?? "—"}
                    {f.properties.victim_country_code
                      ? ` (${f.properties.victim_country_code})`
                      : ""}
                  </Detail>
                  <Detail label="Theme">
                    <Chip size="sm" variant="soft" color="accent" className="font-mono text-[10px]">
                      {f.properties.theme}
                    </Chip>
                  </Detail>
                  <Detail label="Published">
                    {new Date(f.properties.published_at).toLocaleString()}
                  </Detail>
                  <Detail label="Language">
                    {f.properties.language ?? "—"}
                  </Detail>
                  <Detail label="Source">
                    {f.properties.domain ?? "—"}
                  </Detail>
                  <Detail label="Tone">
                    <span
                      className={
                        f.properties.tone != null && f.properties.tone < -3
                          ? "tnum text-danger"
                          : "tnum"
                      }
                    >
                      {f.properties.tone != null ? f.properties.tone.toFixed(2) : "—"}
                    </span>
                  </Detail>
                </dl>
              </Drawer.Body>

              <Drawer.Footer className="border-t border-border pt-3">
                {f.properties.url ? (
                  <Link
                    href={f.properties.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs text-accent"
                  >
                    Open article
                    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                      <path d="M4 1h6v6M10 1L4 7M7 7v3H1V1h3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted">No source URL</span>
                )}
              </Drawer.Footer>
            </>
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="self-center text-[10px] uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="m-0 break-words text-foreground">{children}</dd>
    </>
  );
}
