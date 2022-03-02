// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
	buildOptions: {
		site: 'https://docs.astro.build/',
	},
		// TODO: Enable Shiki!
	// markdownOptions: {
	// 	render: ['@astrojs/markdown-remark', {syntaxHighlight: 'shiki'}],
	//   },
	renderers: [
		// Our main renderer for frontend components
		'@astrojs/renderer-preact',
		// Needed for Algolia search component
		'@astrojs/renderer-react',
	],
});
