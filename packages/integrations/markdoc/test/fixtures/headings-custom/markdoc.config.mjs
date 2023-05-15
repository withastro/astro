import { defineMarkdocConfig, defaultNodes } from '@astrojs/markdoc/config';
import Heading from './src/components/Heading.astro';

export default defineMarkdocConfig({
	nodes: {
		heading: {
			...defaultNodes.heading,
			render: Heading,
		}
	}
});
