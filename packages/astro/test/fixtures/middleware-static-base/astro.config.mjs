import { defineConfig } from 'astro/config';

export default defineConfig({
	base: '/test',
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'fr'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
