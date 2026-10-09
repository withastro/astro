import { defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	nodes: {
		table: {
			attributes: {
				background: {
					type: String,
					matches: ['default', 'transparent'],
				},
			},
		},
	},
});
