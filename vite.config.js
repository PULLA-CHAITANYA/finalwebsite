import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "finalbackend-hherc0arefhubdbk.centralindia-01.azurewebsites.net",
        changeOrigin: true,
      },
    },
  },
});
