import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
// __dirname polyfill for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getViteBase(rawBase) {
  const base = (rawBase || "/").trim();
  if (base === "/") return "/";

  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  return withLeadingSlash.replace(/\/+$/, "") + "/";
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: getViteBase(env.VITE_APP_BASE_PATH),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },

    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8080/api",
          changeOrigin: true,
        },
      },
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
    },
  };
});
