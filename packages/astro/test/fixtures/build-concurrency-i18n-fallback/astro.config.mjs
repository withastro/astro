import { defineConfig } from 'astro/config';

export default defineConfig({
	i18n: {
		locales: ['en', 'es'],
		defaultLocale: 'en',
		fallback: {
			es: 'en',
		},
		routing: {
			prefixDefaultLocale: false,
			redirectToDefaultLocale: false,
			fallbackType: 'rewrite',
		},
	},
	trailingSlash: 'never',
});
