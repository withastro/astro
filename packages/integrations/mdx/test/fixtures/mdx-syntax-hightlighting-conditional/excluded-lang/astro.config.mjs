import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [mdx()],
	markdown: {
		syntaxHighlight: {
			type: 'shiki',
			excludeLangs: ['mermaid'],
		},
	},
});
