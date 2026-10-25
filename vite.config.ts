import { defineConfig } from 'vite';

// GitHub Pages sert le site sous /<nom-du-repo>/. Surchargable via BASE_PATH.
export default defineConfig(({ command }) => ({
  base: process.env.BASE_PATH ?? (command === 'build' ? '/quantum-janitor/' : '/'),
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 5173 },
}));
