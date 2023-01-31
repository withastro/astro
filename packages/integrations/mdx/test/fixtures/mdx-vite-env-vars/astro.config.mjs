import mdx from '@astrojs/mdx';

export default {
	site: 'https://mdx-is-neat.com/',
	markdown: {
		syntaxHighlight: false,
	},
	integrations: [mdx()],
}
