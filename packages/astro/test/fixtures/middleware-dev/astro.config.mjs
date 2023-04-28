import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
	experimental: {
		middleware: true
	}
});
