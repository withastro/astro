// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
	security: {
		csp: true,
	},
	integrations: [react()],
});
