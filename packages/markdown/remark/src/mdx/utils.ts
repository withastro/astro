import type { RehypePlugins, RemarkPlugins } from '@astrojs/internal-helpers/markdown';
import type { Options as AcornOpts } from 'acorn';
import { parse } from 'acorn';
import type { MdxjsEsm } from 'mdast-util-mdx';
import type { Pluggable, PluggableList } from 'unified';

export function jsToTreeNode(
	jsString: string,
	acornOpts: AcornOpts = {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
): MdxjsEsm {
	return {
		type: 'mdxjsEsm',
		value: '',
		data: {
			// @ts-expect-error `parse` return types is incompatible but it should work in runtime
			estree: {
				...parse(jsString, acornOpts),
				type: 'Program',
				sourceType: 'module',
			},
		},
	};
}

/**
 * The MDX compiler cannot resolve string-form plugins the way the `.md` pipeline can,
 * so drop them (with a warning) instead of letting the compiler throw.
 */
export function filterStringPlugins(
	plugins: RemarkPlugins | RehypePlugins | PluggableList,
): PluggableList {
	const validPlugins: PluggableList = [];
	let hasInvalidPlugin = false;
	for (const plugin of plugins) {
		if (typeof plugin === 'string') {
			console.warn(`[MDX] ${plugin} not applied.`);
			hasInvalidPlugin = true;
		} else if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
			console.warn(`[MDX] ${plugin[0]} not applied.`);
			hasInvalidPlugin = true;
		} else {
			validPlugins.push(plugin as Pluggable);
		}
	}
	if (hasInvalidPlugin) {
		console.warn(
			`[MDX] To inherit Markdown plugins in MDX, use explicit imports in your config instead of "strings." See https://docs.astro.build/en/guides/markdown-content/#markdown-plugins`,
		);
	}
	return validPlugins;
}
