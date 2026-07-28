import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    concurrency: 10,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    fallback: {
      es: 'en',
    },
    routing: {
      fallbackType: 'rewrite',
    },
  },
});
