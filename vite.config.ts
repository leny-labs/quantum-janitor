import { defineConfig } from 'vite';

// GitHub Pages sert le site sous /<nom-du-repo>/. Surchargable via BASE_PATH.
export default defineConfig(({ command, isPreview }) => ({
  base: process.env.BASE_PATH ?? (command === 'build' || isPreview ? '/quantum-janitor/' : '/'),
  build: {
    outDir: 'dist',
    // Phaser + Three.js dans un seul bundle (~2,2 Mo, ~580 Ko gzip) : assumé pour un jeu.
    chunkSizeWarningLimit: 2600,
  },
  server: { port: 5173 },
}));
