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
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics'],
          'vendor-motion': ['framer-motion'],
          'vendor-xyflow': ['@xyflow/react'],
          'vendor-lottie': ['lottie-react', '@lottiefiles/dotlottie-react'],
          'vendor-sentry': ['@sentry/react'],
        }
      }
    }
  }
})
