import { defineConfig } from 'astro/config';

export default defineConfig({
  security: {
    checkOrigin: true,
  },
  allowedDomains: [],
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});