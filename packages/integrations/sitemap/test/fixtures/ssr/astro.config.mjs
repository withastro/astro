import nodeServer from '@astrojs/node'
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [sitemap({
		customPages: async (site) => {
			return [
				`${site}/solutions/`,
				`${site}/solutions/one/`,
				`${site}/solutions/two/`,
			];
		}
	})],
	site: 'http://example.com',
	output: 'server',
	adapter: nodeServer({
		mode: "standalone"
	})
})
