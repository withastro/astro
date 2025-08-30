// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
	experimental: {
		csp: true,
	},
	integrations: [react()],
});
