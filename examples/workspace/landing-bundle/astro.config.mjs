// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	output: 'server',	
	
	server: {
		port: 3001,
	},
	
	adapter: node({
		mode: 'standalone',
	}),

	integrations: [react()],
	
	experimental: {
		multiBundle: {
			mode: 'bundle',
		},
	},
});
