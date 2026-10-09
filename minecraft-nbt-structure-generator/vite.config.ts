import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // プレビュー (https://<port>-<sandbox>.e2b.app) からの Host ヘッダを許可。
  // Vite 7 は未知の Host を既定で 403 にするため、そのままでは画面が開かない。
  server: {
    host: true,
    allowedHosts: [".e2b.app", ".e2b.dev", ".e2b-staging.app", "localhost"],
  },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
