import { defineConfig} from "astro/config";

export default defineConfig({
	trailingSlash: "never",
	i18n: {
		defaultLocale: 'en',
		locales: [
			'en', 'pt', 'it'
		],
		domains: {
			pt: "https://example.pt"
		},
		routing: {
			strategy: "domains"
		}
	},
	experimental: {
		i18nDomains: true
	},
	site: "https://example.com",
	base: "/new-site"
})
