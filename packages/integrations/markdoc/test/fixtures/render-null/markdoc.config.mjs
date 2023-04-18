import { defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	nodes: {
		document: {
			render: null,

			// Defaults from `Markdoc.nodes.document`
			children: [
				'heading',
				'paragraph',
				'image',
				'table',
				'tag',
				'fence',
				'blockquote',
				'comment',
				'list',
				'hr',
			],
			attributes: {
				frontmatter: { render: false },
			},
		}
	}
})
