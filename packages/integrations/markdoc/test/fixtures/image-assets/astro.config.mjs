import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import { testImageService } from '../../../../../astro/test/test-image-service.js';

// https://astro.build/config
export default defineConfig({
	experimental: {
		assets: true,
	},
	image: {
		service: testImageService(),
	},
	integrations: [markdoc()],
});
