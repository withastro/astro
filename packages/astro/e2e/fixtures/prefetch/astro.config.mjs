import node from '@astrojs/node'
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	adapter: node({ mode: 'standalone' }),
	integrations: [react()],
	devToolbar: {
		enabled: false,
	},
	prefetch: true
});
