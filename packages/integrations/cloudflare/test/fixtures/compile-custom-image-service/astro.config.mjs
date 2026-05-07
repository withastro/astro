import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: cloudflare({
		imageService: { build: 'compile' },
	}),
	output: 'static',
	image: {
		service: {
			entrypoint: './src/image-service.ts',
		},
	},
});
