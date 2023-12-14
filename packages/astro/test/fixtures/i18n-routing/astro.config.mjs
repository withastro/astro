import { defineConfig} from "astro/config";

export default defineConfig({
		i18n: {
			defaultLocale: 'en',
			locales: [
				'en', 
				'pt', 
				'it', 
				{
					path: "spanish",
					codes: ["es", "es-SP"]
				}
			],
			domains: {
				it: "https://it.example.com"
			},
			routingStrategy: "domain"
		}
})
