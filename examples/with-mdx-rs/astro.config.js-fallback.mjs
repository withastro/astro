// @ts-check
import { defineConfig } from 'astro/config';

// Configuration for JS processor comparison
export default defineConfig({
	experimental: {
		markdownRS: false, // Disabled for comparison
	},
	markdown: {
		// Standard markdown options
		gfm: true,
		smartypants: true,
	},
});
