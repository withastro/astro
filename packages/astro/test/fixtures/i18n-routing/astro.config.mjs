import { defineConfig} from "astro/config";

export default defineConfig({
	experimental: {
		i18n: {
			defaultLocale: 'en',
			locales: [
				'en', 'pt', 'it'
			],
			domains: {
				it: "https://it.example.com"
			}
		}
	},
})
