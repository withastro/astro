import { defineConfig } from 'astro/config';

export default defineConfig({
	build: {
    format: 'file',
  },
  i18n: {
    defaultLocale: 'en-us',
    locales: [
      {
        path: 'en-us',
        codes: ['en-US'],
      },
      {
        path: 'es-mx',
        codes: ['es-MX'],
      },
      {
        path: 'fr-fr',
        codes: ['fr-FR'],
      }
    ],
    routing: {
      prefixDefaultLocale: true,
			redirectToDefaultLocale: false,
    }
  },
  output: 'static',
  trailingSlash: 'never',
});