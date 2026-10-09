import cloudflare from '@astrojs/cloudflare';
import { defineConfig, passthroughImageService } from 'astro/config';

export default defineConfig({
	adapter: cloudflare({ imageService: 'custom' }),
	image: {
		service: passthroughImageService(),
	},
});
