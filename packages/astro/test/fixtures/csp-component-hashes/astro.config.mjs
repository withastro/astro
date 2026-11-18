// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
	security: {
		csp: true,
	},
	integrations: [mdx()],
});
