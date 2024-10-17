import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	i18n: {
		defaultLocale: "en",
		locales: [
			"en",
			"fr",
			"es",
			{
				path: "portuguese",
				codes: [
					"pt-AO",
					"pt",
					"pt-BR",
				],
		}],
	},
});
