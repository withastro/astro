import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [react()],
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
});
