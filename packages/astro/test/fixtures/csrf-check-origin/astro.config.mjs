import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: "server",
	experimental: {
		security: {
			csrfProtection: {
				origin: true
			}
		}
	}
});

