import { defineConfig } from 'vite';
import { resolve } from 'path';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    electron([
      {
        // Main process entry
        entry: 'main.js',
      },
      {
        // Preload scripts
        entry: 'preload.js',
        onstart(options) {
          options.startup();
        },
      },
    ]),
    renderer(),
  ],
  base: './', // Use relative paths
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        callback: resolve(__dirname, 'callback.html')
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {
    include: ['three'],
  },
}); 