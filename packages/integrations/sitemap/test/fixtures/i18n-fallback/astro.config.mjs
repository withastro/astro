import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [sitemap()],
	site: 'http://example.com',
	i18n: {
		locales: ['en', 'fr'],
		defaultLocale: 'en',
		fallback: {
			fr: 'en',
		},
		routing: {
			prefixDefaultLocale: false,
			fallbackType: 'rewrite',
		},
	},
});
