import { defineConfig } from 'astro/config';

export default defineConfig({
  build: {
    inlineStylesheets: 'never',
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
    routing: {
      redirectToDefaultLocale: false,
    },
  },
});
