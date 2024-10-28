import { defineConfig } from "astro/config";

export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja', 'ko', 'zh'],
    routing: {
      prefixDefaultLocale: true,
      fallbackType: 'rewrite',
      redirectToDefaultLocale: true,
    },
    fallback: {
      ja: 'en',
      ko: 'en',
      zh: 'en',
    },
  },
})
