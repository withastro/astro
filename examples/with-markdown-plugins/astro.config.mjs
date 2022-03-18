import { defineConfig } from 'astro/config';
import astroRemark from '@astrojs/markdown-remark';
import addClasses from './add-classes.mjs';

// https://astro.build/config
export default defineConfig({
	// Enable Custom Markdown options, plugins, etc.
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
