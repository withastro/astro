import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://astro.build/",
	i18n: {
		locales: ["en", "fr"],
		defaultLocale: "en",
	},
	integrations: [
		{
 		name: 'config',
		    hooks: {
				'astro:config:setup': ({ updateConfig }) => {
					    updateConfig({
							 base: '/blog',
            				site: 'https://example.com',
            				trailingSlash: 'always',
						})
				}
			}
		}
	]
	
});
