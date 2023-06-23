import { defineMarkdocConfig, component, nodes } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	nodes: {
		heading: {
			...nodes.heading,
			render: component('./src/components/Heading.astro'),
		}
	}
});
