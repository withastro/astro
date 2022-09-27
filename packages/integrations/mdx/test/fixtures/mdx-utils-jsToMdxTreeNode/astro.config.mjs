import mdx from '@astrojs/mdx';
import { jsToMdxTreeNode } from '@astrojs/mdx/utils';

export default {
	site: 'https://mdx-is-neat.com/',
	markdown: {
		syntaxHighlight: false,
	},
	integrations: [mdx({
		remarkPlugins: [
			function injectComponentsExport() {
				const titlePath = new URL('./src/components/Title.astro', import.meta.url).pathname;
				return (tree) => {
					tree.children.unshift(
						jsToMdxTreeNode(`
						import Title from ${JSON.stringify(titlePath)};
						export const components = { h1: Title };
					`));
				};
			}
		]
	})],
}
