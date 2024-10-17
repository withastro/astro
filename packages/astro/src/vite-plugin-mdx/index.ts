import { type Plugin, transformWithEsbuild } from 'vite';
import { CONTENT_FLAG, PROPAGATED_ASSET_FLAG } from '../content/index.js';
import { astroEntryPrefix } from '../core/build/plugins/plugin-component-entry.js';
import { removeQueryString } from '../core/path.js';
import { transformJSX } from './transform-jsx.js';

// Format inspired by https://github.com/vitejs/vite/blob/main/packages/vite/src/node/constants.ts#L54
const SPECIAL_QUERY_REGEX = new RegExp(
	`[?&](?:worker|sharedworker|raw|url|${CONTENT_FLAG}|${PROPAGATED_ASSET_FLAG})\\b`,
);

/**
 * @deprecated This plugin is no longer used. Remove in Astro 5.0
 */
export default function mdxVitePlugin(): Plugin {
	return {
		name: 'astro:jsx',
		enforce: 'pre', // run transforms before other plugins
		async transform(code, id, opts) {
			// Skip special queries and astro entries. We skip astro entries here as we know it doesn't contain
			// JSX code, and also because we can't detect the import source to apply JSX transforms.
			if (SPECIAL_QUERY_REGEX.test(id) || id.startsWith(astroEntryPrefix)) {
				return null;
			}
			id = removeQueryString(id);
			// Shortcut: only use Astro renderer for MD and MDX files
			if (!id.endsWith('.mdx')) {
				return null;
			}
			const { code: jsxCode } = await transformWithEsbuild(code, id, {
				loader: 'jsx',
				jsx: 'preserve',
				sourcemap: 'inline',
				tsconfigRaw: {
					compilerOptions: {
						// Ensure client:only imports are treeshaken
						verbatimModuleSyntax: false,
						importsNotUsedAsValues: 'remove',
					},
				},
			});
			return await transformJSX(jsxCode, id, opts?.ssr);
		},
	};
}
