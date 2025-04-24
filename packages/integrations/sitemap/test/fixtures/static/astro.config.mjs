import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [sitemap({
      i18n: {
          defaultLocale: 'it',
          locales: {
              it: 'it-IT',
              de: 'de-DE',
          }
      },
      customPages: ['http://example.com/custom-page'],
  })],
	site: 'http://example.com',
      redirects: {
        '/redirect': '/'
      },
})
