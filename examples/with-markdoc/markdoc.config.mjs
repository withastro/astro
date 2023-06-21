import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import Ben from './src/components/Ben.astro';

export default defineMarkdocConfig({
	tags: {
		ben: {
			render: Ben,
		},
	},
});
