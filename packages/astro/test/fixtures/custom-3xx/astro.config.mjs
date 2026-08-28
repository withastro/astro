import { defineConfig } from 'astro/config';

export default defineConfig({
  redirects: {
    '/configured': {
      status: 302,
      destination: '/target',
    },
  },
});
