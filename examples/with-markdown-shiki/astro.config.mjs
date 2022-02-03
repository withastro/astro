// Full Astro Configuration API Documentation:
// https://docs.astro.build/reference/configuration-reference

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.
import astroRemark from '@astrojs/markdown-remark';

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
	// Enable Custom Markdown options, plugins, etc.
	markdownOptions: {
		render: [
			astroRemark,
			{
				syntaxHighlight: 'shiki',
				shikiConfig: {
					theme: 'dracula',
					// Learn more about this configuration here:
					// https://docs.astro.build/en/guides/markdown-content/#syntax-highlighting
				},
			},
		],
	},
});
