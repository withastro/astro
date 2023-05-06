import { defineConfig } from 'astro/config';

export default defineConfig({
	output: "static",
	experimental: {
		middleware: true
	}
});
