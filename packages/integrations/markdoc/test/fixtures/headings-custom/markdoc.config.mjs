import { defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';
import Heading from './src/components/Heading.astro';

export default defineMarkdocConfig({
	nodes: {
		heading: {
			...nodes.heading,
			render: Heading,
		}
	}
});
