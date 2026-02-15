import { defineConfig } from 'astro/config';
import node from "@astrojs/node"
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
	output: 'static',
	adapter: node(),
});
