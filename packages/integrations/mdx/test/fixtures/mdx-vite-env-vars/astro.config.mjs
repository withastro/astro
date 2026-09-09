import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';

export default {
	site: 'https://mdx-is-neat.com/',
	markdown: {
		syntaxHighlight: false,
		// Keep straight quotes so assertions can match `import.meta.env` output literally.
		processor: satteri({ features: { smartPunctuation: false } }),
	},
	integrations: [mdx()],
	vite: {
		build: {
			// Enabling sourcemap may crash the build when using `import.meta.env.UNKNOWN_VAR`
			// https://github.com/withastro/astro/issues/9012
			sourcemap: true,
		},
	},
}
