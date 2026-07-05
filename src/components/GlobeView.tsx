import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Deck, _GlobeView as DeckGlobeView } from "@deck.gl/core";
import type { Layer } from "@deck.gl/core";

export interface GlobeViewHandle {
  flyTo: (lon: number, lat: number, zoom?: number, durationMs?: number) => void;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: { padding?: number }
  ) => void;
}

interface Props {
  layers: Layer[];
  onReady?: () => void;
}

const VIEW_ID = "globe";

const INITIAL_VIEW_STATE = {
  [VIEW_ID]: {
    longitude: 0,
    latitude: 20,
    zoom: 1.2,
    minZoom: 0,
    maxZoom: 8,
    pitch: 0,
    bearing: 0,
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyViewState = any;

export const GlobeView_ = forwardRef<GlobeViewHandle, Props>(function GlobeView(
  { layers, onReady },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deckRef = useRef<Deck<any> | null>(null);
  const viewStateRef = useRef<AnyViewState>({ ...INITIAL_VIEW_STATE[VIEW_ID] });
  const animFrameRef = useRef<number | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useImperativeHandle(ref, () => ({
    flyTo: (lon, lat, zoom, durationMs = 1200) => {
      const target = {
        longitude: lon,
        latitude: lat,
        zoom: zoom ?? Math.max(viewStateRef.current.zoom, 3.5),
      };
      animateTo(target, durationMs);
    },
    fitBounds: (bounds, _options) => {
      const [[minLon, minLat], [maxLon, maxLat]] = bounds;
      const lon = (minLon + maxLon) / 2;
      const lat = (minLat + maxLat) / 2;
      const lonSpan = Math.abs(maxLon - minLon) || 1;
      const latSpan = Math.abs(maxLat - minLat) || 1;
      const span = Math.max(lonSpan, latSpan * 2);
      const zoom = Math.min(8, Math.max(0.5, 7 - Math.log2(span)));
      animateTo({ longitude: lon, latitude: lat, zoom }, 1000);
    },
  }));

  function animateTo(
    target: { longitude: number; latitude: number; zoom: number },
    durationMs: number
  ) {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const start = { ...viewStateRef.current };
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const newVs = {
        ...viewStateRef.current,
        longitude: lerp(start.longitude, target.longitude, eased),
        latitude: lerp(start.latitude, target.latitude, eased),
        zoom: lerp(start.zoom, target.zoom, eased),
      };
      viewStateRef.current = newVs;
      deckRef.current?.setProps({
        initialViewState: { [VIEW_ID]: newVs },
      });
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (!containerRef.current || deckRef.current) return;

    const deck = new Deck({
      parent: containerRef.current,
      views: [new DeckGlobeView({ id: VIEW_ID, resolution: 6 })],
      initialViewState: INITIAL_VIEW_STATE,
      controller: { inertia: true },
      layers: [],
      onViewStateChange: ({ viewState }: { viewState: AnyViewState }) => {
        viewStateRef.current = viewState;
        deck.setProps({ initialViewState: { [VIEW_ID]: viewState } } as any);
      },
      onAfterRender: () => {
        onReadyRef.current?.();
      },
    } as any);

    deckRef.current = deck;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      deck.finalize();
      deckRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (deckRef.current) {
      deckRef.current.setProps({ layers });
    }
  }, [layers]);

  return (
    <div ref={containerRef} className="globe-view relative">
      <StarField />
      <AtmosphereGlow />
    </div>
  );
});

export const GlobeView = GlobeView_;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ---- CSS-based star field background (behind the WebGL canvas) ---- */
function StarField() {
  const stars = useRef(
    Array.from({ length: 180 }, () => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 1.5 + 0.3;
      const opacity = Math.random() * 0.5 + 0.2;
      const delay = Math.random() * 4;
      return { x, y, size, opacity, delay };
    })
  ).current;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animation: `twinkle 3s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ---- Atmospheric glow ring (CSS, sits behind the globe canvas) ---- */
function AtmosphereGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(circle at 50% 55%, transparent 28%, rgba(90,209,255,0.06) 36%, rgba(90,209,255,0.03) 44%, transparent 52%)",
      }}
    />
  );
}
