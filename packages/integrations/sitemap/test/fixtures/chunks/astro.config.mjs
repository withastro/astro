import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [
		sitemap({
			chunks: {
				'blog': (item) => {
					if (/blog/.test(item.url)) {
						item.changefreq = 'weekly';
						item.lastmod = new Date();
						item.priority = 0.9;
						return item;
					}
				}
			},
		}),
	],
	site: 'http://example.com',
	redirects: {
		'/redirect': '/'
	},
})
