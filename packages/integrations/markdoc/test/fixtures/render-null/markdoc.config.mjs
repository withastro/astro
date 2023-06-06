import { defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	nodes: {
		document: {
			...nodes.document,
			render: null,
		}
	}
})
