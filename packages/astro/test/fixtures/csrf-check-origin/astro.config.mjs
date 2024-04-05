import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: "server",
	security: {
		csrfProtection: {
			origin: true
		}
	},
	experimental: {
		csrfProtection: true
	}
});

