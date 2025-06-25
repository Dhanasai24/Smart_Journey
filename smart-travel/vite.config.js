import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // ✅ Allow external connections
    port: 5173,
    strictPort: true, // ✅ Fail if port is already in use
    // ✅ Show both localhost and network URLs
    open: false, // Don't auto-open browser
  },
  // ✅ Preview configuration for production builds
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  // ✅ NEW: Fix for browser compatibility issues
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    exclude: ["simple-peer"], // ✅ Exclude problematic package
  },
})
