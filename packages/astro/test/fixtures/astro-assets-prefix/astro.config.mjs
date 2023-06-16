import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { testImageService } from '../../test-image-service.js';

// https://astro.build/config
export default defineConfig({
	// test custom base to make sure things work
	base: '/custom-base',
	integrations: [react()],
	build: {
		assetsPrefix: 'http://localhost:4321',
	},
	experimental: {
		assets: true,
	},
	image: {
		service: testImageService(),
	},
});
