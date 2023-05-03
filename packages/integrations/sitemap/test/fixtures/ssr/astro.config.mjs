import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import nodeServer from '@astrojs/node'

export default defineConfig({
  integrations: [sitemap()],
	site: 'http://example.com',
	output: 'server',
	adapter: nodeServer({
		mode: "standalone"
	})
})
