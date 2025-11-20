import { defineConfig} from "astro/config";

export default defineConfig({
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    routing: {
      fallbackType: 'rewrite',
    },
    fallback: {
      de: 'en',
    },
  },
});
