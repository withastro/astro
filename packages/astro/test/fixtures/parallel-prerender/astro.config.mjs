import { defineConfig } from 'astro/config';

export default defineConfig({
	redirects: { '/old': '/' },
	i18n: {
		locales: ['en', 'fr'],
		defaultLocale: 'en',
		fallback: { fr: 'en' },
		routing: { fallbackType: 'rewrite', prefixDefaultLocale: false },
	},
});
