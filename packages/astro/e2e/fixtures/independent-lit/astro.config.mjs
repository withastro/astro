import lit from '@astrojs/lit';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [lit()],
	devToolbar: {
		enabled: false,
	},
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	experimental: {
		isIndependent: true,
	}
});
