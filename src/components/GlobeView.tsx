import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "@deck.gl/core";

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "simple-tiles": {
      type: "raster",
      tiles: [
        "https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "&copy; CARTO &copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#05080f" },
    },
    {
      id: "simple",
      type: "raster",
      source: "simple-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

interface Props {
  layers: Layer[];
  onMapReady?: (map: maplibregl.Map) => void;
}

export function GlobeView({ layers, onMapReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [0, 20],
      zoom: 1.5,
      maxZoom: 8,
      minZoom: 1,
      renderWorldCopies: false,
      dragRotate: true,
      pitchWithRotate: true,
    });

    const overlay = new MapboxOverlay({
      layers: [],
    });
    map.addControl(overlay);
    mapRef.current = map;
    overlayRef.current = overlay;

    map.on("load", () => {
      onMapReady?.(map);
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, [onMapReady]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers });
    }
  }, [layers]);

  return <div ref={containerRef} className="globe-view" />;
}
