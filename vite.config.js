import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "localhost",
    port: 8081,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5050",
        changeOrigin: true,
        timeout: 240000,
        proxyTimeout: 240000,
      },
    },
  },
  preview: {
    host: "localhost",
    proxy: { "/api": { target: "http://127.0.0.1:5050", changeOrigin: true } },
  },
});
