import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	tags: {
		aside: {
			render: component('./src/components/Aside.astro'),
			attributes: {
				type: { type: String },
				title: { type: String },
			},
		},
		authorName: {
			render: component('./src/components/AuthorName.astro'),
			attributes: {
				slug: { type: String },
			},
		},
	},
});
