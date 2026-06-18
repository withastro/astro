import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// Tests rewrite this baseline config to cover build-time image generation modes
// with and without a user-defined `image.service`.
export default defineConfig({
	adapter: cloudflare({
		imageService: 'compile',
	}),
	output: 'static',
	image: {
		service: {
			entrypoint: './src/image-service.ts',
		},
	},
});
