import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import Aside from './src/components/Aside.astro';

export default defineMarkdocConfig({
	tags: {
		aside: {
			render: Aside,
			attributes: {
				type: { type: String },
				title: { type: String },
			},
		},
	},
});
