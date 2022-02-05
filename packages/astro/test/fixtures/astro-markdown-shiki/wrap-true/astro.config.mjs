export default {
	markdownOptions: {
		render: ['@astrojs/markdown-remark', { syntaxHighlight: 'shiki', shikiConfig: { wrap: true } }],
	},
	buildOptions: {
		sitemap: false,
	},
}
