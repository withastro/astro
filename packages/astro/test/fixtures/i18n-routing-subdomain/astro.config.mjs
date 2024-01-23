import { defineConfig} from "astro/config";

export default defineConfig({
	trailingSlash: "never",
	i18n: {
		defaultLocale: 'en',
		locales: [
			'en', 'pt', 'it'
		],
		domains: {
			pt: "https://example.pt",
			it: "http://it.example.com"
		},
		routing: {
			strategy: "domains",
			prefixDefaultLocale: true,
			redirectToDefaultLocale: false
		}
	},
	experimental: {
		i18nDomains: true
	},
	site: "https://example.com",
	base: "/new-site"
})
