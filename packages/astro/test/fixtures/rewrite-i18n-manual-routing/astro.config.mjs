import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	experimental: {
		rewriting: true
	},
	i18n: {
		routing: "manual",
		locales: ["en", "es"],
		defaultLocale: "en"
	}
});
