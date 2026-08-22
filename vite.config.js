import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/Niu-LKH/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
          'vendor-xlsx': ['xlsx'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
