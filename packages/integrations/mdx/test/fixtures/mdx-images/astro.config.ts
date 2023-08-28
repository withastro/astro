import mdx from '@astrojs/mdx';
import { testImageService } from '../../../../../astro/test/test-image-service.js';

export default {
	integrations: [mdx()],
	image: {
		service: testImageService(),
	},
}
