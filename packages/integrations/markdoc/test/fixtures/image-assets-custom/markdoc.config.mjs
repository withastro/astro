import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	nodes: {
		image: {
			...nodes.image,
			render: component('./src/components/Image.astro'),
		},
	},
	tags: {
		image: {
			attributes: nodes.image.attributes,
			render: component('./src/components/Image.astro'),
		},
	},
});
