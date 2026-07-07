import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages serves the app from /<repo-name>/; used in dev too so that
  // dev, preview and production behave identically.
  base: '/kingdomoptimizer/',
});
