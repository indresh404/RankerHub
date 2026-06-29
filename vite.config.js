import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Use function syntax instead of object for manualChunks
        manualChunks(id) {
          // Core React vendor
          if (id.includes("node_modules")) {
            // React core
            if (id.includes("react") && !id.includes("react-lottie")) {
              return "vendor-react";
            }

            // Firebase
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }

            // Lottie animations
            if (id.includes("lottie")) {
              return "vendor-animations";
            }

            // Lucide icons (large library)
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            // Framer motion
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }

            // Swiper (Carousel)
            if (id.includes("swiper")) {
              return "vendor-swiper";
            }

            // All other node_modules
            return "vendor";
          }
        },
      },
    },
    // Increase chunk size warning limit to 2MB
    chunkSizeWarningLimit: 2000,
  },
});
