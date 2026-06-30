import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          deckgl: [
            "@deck.gl/core",
            "@deck.gl/layers",
            "@deck.gl/aggregation-layers",
            "@deck.gl/mapbox",
          ],
          maplibre: ["maplibre-gl"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
