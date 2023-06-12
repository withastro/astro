import mdx from '@astrojs/mdx';
import { testImageService } from '../../../../../astro/test/test-image-service.js';

export default {
	integrations: [mdx()],
	experimental: {
		assets: true,
	},
	image: {
		service: testImageService(),
	},
}
