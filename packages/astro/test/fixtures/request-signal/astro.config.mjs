import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	adapter: node({
		serverEntrypoint: '@astrojs/node/node-handler'
	}),
});
