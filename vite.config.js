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
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true,
    },
  },
  optimizeDeps: {
    include: ['three'],
  },
}); 