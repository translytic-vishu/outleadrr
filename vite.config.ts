import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isReplit = process.env.REPL_ID !== undefined;
const isDev = process.env.NODE_ENV !== "production";

export default defineConfig(async () => {
  const replitPlugins =
    isReplit && isDev
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner()
          ),
          await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default()
          ),
        ]
      : [];

  return {
    plugins: [react(), ...replitPlugins],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
