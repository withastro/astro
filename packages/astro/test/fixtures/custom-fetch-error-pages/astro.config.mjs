import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt'],
  },
});
