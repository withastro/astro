export default {
	markdownOptions: {
		render: ['@astrojs/markdown-remark', { syntaxHighlight: 'shiki' }],
	},
	buildOptions: {
		sitemap: false,
	},
}
