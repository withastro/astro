import { defineConfig } from 'astro/config';

export default defineConfig({
  security: {
    checkOrigin: true,
  },
  // No allowedDomains configured
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});