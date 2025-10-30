import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    failOnPrerenderConflict: false,
  },
});
