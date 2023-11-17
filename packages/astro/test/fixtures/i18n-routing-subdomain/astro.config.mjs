import { defineConfig} from "astro/config";

export default defineConfig({
	trailingSlash: "never",
	experimental: {
		i18n: {
			defaultLocale: 'en',
			locales: [
				'en', 'pt', 'it'
			],
			domains: {
				pt: "https://example.pt"
			},
			routingStrategy: "domain"
		},
		
	},
	base: "/new-site"
})
