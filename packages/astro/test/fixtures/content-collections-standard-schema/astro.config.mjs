import { defineConfig } from 'astro/config';
import { testImageService } from '../../test-image-service.js';

export default defineConfig({
	image: {
		service: testImageService(),
	},
});
