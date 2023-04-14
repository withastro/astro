import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import remarkToc from 'remark-toc'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'
// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [[remarkToc, {
			heading: "contents"
		}]],
		rehypePlugins: [rehypeHeadingIds, rehypeSlug, rehypeStringify, [rehypeAutolinkHeadings, {
			behavior: 'append'
		}]],
		syntaxHighlight: 'shiki',
		shikiConfig: {
			theme: 'dracula',
			// Learn more about this configuration here:
			// https://docs.astro.build/en/guides/markdown-content/#syntax-highlighting
		},
	},
	integrations: [markdoc()],
});
