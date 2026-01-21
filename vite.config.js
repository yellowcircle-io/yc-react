import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Strip console.log and debugger statements in production builds
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    // Increase warning limit - we know about large chunks
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React - always needed
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('/react/') && !id.includes('lottie')) {
            return 'vendor-react';
          }

          // Firebase - keep together to avoid initialization order issues
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'vendor-firebase';
          }

          // Lottie - heavy, lazy loaded (consolidated to lottie-react only)
          if (id.includes('lottie-web') || id.includes('lottie-react')) {
            return 'vendor-lottie';
          }

          // Sentry - lazy load after initial render
          if (id.includes('@sentry')) {
            return 'vendor-sentry';
          }

          // React Flow - only needed for Unity pages
          if (id.includes('@xyflow') || id.includes('reactflow')) {
            return 'vendor-xyflow';
          }

          // Framer Motion - used for animations
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }

          // Lucide icons - split from main bundle
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        }
      }
    }
  }
})
