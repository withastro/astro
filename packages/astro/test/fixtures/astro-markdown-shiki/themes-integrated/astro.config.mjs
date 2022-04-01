export default {
	markdownOptions: {
		render: ["@astrojs/markdown-remark", { syntaxHighlight: 'shiki', shikiConfig: { theme: 'github-light' } }],
	},
}
