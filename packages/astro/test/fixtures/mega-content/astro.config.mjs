import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { testImageService } from '../../test-image-service.js';

// https://astro.build/config
export default defineConfig({
	// test custom base to make sure things work
	base: '/custom-base',
	integrations: [react(), mdx()],
	build: {
		assetsPrefix: 'http://localhost:4321',
		inlineStylesheets: 'never',
	},
	image: {
		service: testImageService(),
	},
});
