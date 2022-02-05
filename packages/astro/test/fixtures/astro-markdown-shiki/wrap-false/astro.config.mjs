export default {
	markdownOptions: {
		render: ['@astrojs/markdown-remark', { syntaxHighlight: 'shiki', shikiConfig: { wrap: false } }],
	},
	buildOptions: {
		sitemap: false,
	},
}
