import { defineConfig } from 'astro/config';
import astroRemark from '@astrojs/markdown-remark';

// https://astro.build/config
export default defineConfig({
	// Enable Custom Markdown options, plugins, etc.
	renderers: [],
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
