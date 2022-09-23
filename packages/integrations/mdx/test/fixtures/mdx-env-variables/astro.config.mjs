import mdx from '@astrojs/mdx';

export default {
	markdown: {
		syntaxHighlight: false,
	},
	integrations: [mdx()],
}
