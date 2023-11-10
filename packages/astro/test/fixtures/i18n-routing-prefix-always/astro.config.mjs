import { defineConfig} from "astro/config";

export default defineConfig({
	experimental: {
		i18n: {
			defaultLocale: 'en',
			locales: [
				'en', 'pt', 'it'
			], 
			routingStrategy: "prefix-always"
		}
	},
	base: "/new-site"
})
