import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { screenGraphPlugin } from "@animaapp/vite-plugin-screen-graph";

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && screenGraphPlugin()],
  publicDir: "./static",
  base: "./",
  server: {
    host: "0.0.0.0", // ⭐ 외부 기기 접속 허용
    port: 5137,
  },
}));
