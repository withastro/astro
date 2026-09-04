import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import { testImageService } from '../../../../../astro/test/test-image-service.ts';

export default defineConfig({
	adapter: vercel({
		imageService: true,
	}),
	image: {
		service: testImageService(),
		domains: ['astro.build'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**.amazonaws.com',
			},
		],
	},
});
