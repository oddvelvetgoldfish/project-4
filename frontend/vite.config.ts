import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  build: {
    // Specify the output directory relative to the project's root
    outDir: '../backend/static/frontend',

    // Disable filename hashing for JS and CSS files
    rollupOptions: {
      output: {
        // Entry JS files
        entryFileNames: 'assets/main.js',
        // Chunk JS files (dynamic imports)
        chunkFileNames: 'assets/[name].js',
        // Asset files (CSS, images, etc.)
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/style.css';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
    // Disable CSS code splitting to generate a single CSS file
    cssCodeSplit: false,
  },
});
