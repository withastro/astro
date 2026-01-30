import { defineConfig } from 'astro/config';

export default defineConfig({
	i18n: {
		defaultLocale: 'en',
		locales: [
			'en',
			{
				path: 'es',
				codes: ['es', 'es-ES', 'es-MX'],
			},
		],
		routing: {
			prefixDefaultLocale: false,
			redirectToDefaultLocale: true,
			fallback: {
				es: 'en',
			},
		},
	},
});