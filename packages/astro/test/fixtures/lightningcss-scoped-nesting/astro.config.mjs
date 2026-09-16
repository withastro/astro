import { defineConfig } from 'astro/config';

// Reproduces https://github.com/withastro/astro/issues/16524.
// `vite.css.transformer: 'lightningcss'` was the minimal trigger for the bug.
export default defineConfig({
	vite: {
		css: {
			transformer: 'lightningcss',
		},
	},
	build: {
		// authored when inlineStylesheets defaulted to never
		inlineStylesheets: 'never',
	},
});
