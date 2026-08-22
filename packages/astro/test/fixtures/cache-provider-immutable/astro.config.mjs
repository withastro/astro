// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	cache: {
		provider: {
			name: 'passthrough',
			entrypoint: new URL('./provider.mjs', import.meta.url),
		},
	},
});
