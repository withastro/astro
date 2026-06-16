import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// `imageService: 'compile'` with a user-defined `image.service`. The adapter
// should preserve the custom service for getURL/getHTMLAttributes AND invoke its
// transform() during the build-time generation pass (instead of hardcoding sharp).
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
