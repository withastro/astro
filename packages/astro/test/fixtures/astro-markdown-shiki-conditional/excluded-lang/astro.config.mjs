import { defineConfig } from 'astro/config';

export default defineConfig({
	markdown: {
		syntaxHighlight: {
			type: 'shiki',
			excludeLangs: ['mermaid'],
		},
	},
});
