import vercel from '@astrojs/vercel/static';
import { defineConfig } from 'astro/config';
import { testImageService } from '../../../../../astro/test/test-image-service.js';

export default defineConfig({
	adapter: vercel({imageService: true}),
	experimental: {
		assets: true,
	},
	image: {
		service: testImageService(),
	},
});
