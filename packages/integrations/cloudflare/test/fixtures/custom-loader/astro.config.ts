import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: cloudflare(),
	output: 'server',
	vite: {
		optimizeDeps: {
			// Reproduces issue #16491: packages with non-standard file imports
			// (like .data, .wasm) need to be excludable from SSR dep optimization.
			// Without the fix, this exclude is silently ignored for server
			// environments, causing esbuild to fail with "No loader is configured
			// for .data files".
			exclude: ['fake-data-pkg'],
		},
	},
});
