// Full Astro Configuration API Documentation:
// https://docs.astro.build/reference/configuration-reference

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.
import astroRemark from '@astrojs/markdown-remark';
import addClasses from './add-classes.mjs';

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
	// Enable Custom Markdown options, plugins, etc.
	renderers: [],
	markdownOptions: {
		render: [
			astroRemark,
			{
				remarkPlugins: ['remark-code-titles'],
				rehypePlugins: [['rehype-autolink-headings', { behavior: 'prepend' }], ['rehype-toc', { headings: ['h2', 'h3'] }], [addClasses, { 'h1,h2,h3': 'title' }], 'rehype-slug'],
			},
		],
	},
});
