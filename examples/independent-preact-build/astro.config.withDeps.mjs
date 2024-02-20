import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	// Enable Preact to support Preact JSX components.
	output: 'server',
	integrations: [preact()],
	adapter: node({
		mode: 'standalone',
		isIndependent: true,
	}),
});
