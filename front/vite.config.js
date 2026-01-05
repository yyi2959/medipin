import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { screenGraphPlugin } from "@animaapp/vite-plugin-screen-graph";

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && screenGraphPlugin()],
  publicDir: "./static",
  base: "./",
  server: {
    host: "0.0.0.0", // ⭐ 외부 기기 접속 허용
    port: 5173,
    proxy: {
      // 🚨 프론트(HTTPS/ngrok)에서 백엔드(HTTP/로컬IP)로 보낼 때 발생하는
      // Mixed Content 오류를 방지하기 위해 프록시를 설정합니다.
      // 이제 front/src/api/config.js에서 API_BASE_URL을 "/api" 로 설정하면 됩니다.
      "/api": {
        target: "http://172.16.30.3:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
}));
