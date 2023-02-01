import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import {
	InvalidAstroDataError,
	safelyGetAstroData,
} from '@astrojs/markdown-remark/dist/internal.js';
import { nodeTypes } from '@mdx-js/mdx';
import type { PluggableList } from '@mdx-js/mdx/lib/core.js';
import type { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroConfig } from 'astro';
import type { Literal, MemberExpression } from 'estree';
import { visit as estreeVisit } from 'estree-util-visit';
import { bold, yellow } from 'kleur/colors';
import type { Image } from 'mdast';
import { pathToFileURL } from 'node:url';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { MdxOptions } from './index.js';
import { rehypeInjectHeadingsExport } from './rehype-collect-headings.js';
import rehypeMetaString from './rehype-meta-string.js';
import remarkPrism from './remark-prism.js';
import remarkShiki from './remark-shiki.js';
import { isRelativePath, jsToTreeNode } from './utils.js';

export function recmaInjectImportMetaEnvPlugin({
	importMetaEnv,
}: {
	importMetaEnv: Record<string, any>;
}) {
	return (tree: any) => {
		estreeVisit(tree, (node) => {
			if (node.type === 'MemberExpression') {
				// attempt to get "import.meta.env" variable name
				const envVarName = getImportMetaEnvVariableName(node as MemberExpression);
				if (typeof envVarName === 'string') {
					// clear object keys to replace with envVarLiteral
					for (const key in node) {
						delete (node as any)[key];
					}
					const envVarLiteral: Literal = {
						type: 'Literal',
						value: importMetaEnv[envVarName],
						raw: JSON.stringify(importMetaEnv[envVarName]),
					};
					Object.assign(node, envVarLiteral);
				}
			}
		});
	};
}

export function rehypeApplyFrontmatterExport() {
	return function (tree: any, vfile: VFile) {
		const astroData = safelyGetAstroData(vfile.data);
		if (astroData instanceof InvalidAstroDataError)
			throw new Error(
				// Copied from Astro core `errors-data`
				// TODO: find way to import error data from core
				'[MDX] A remark or rehype plugin attempted to inject invalid frontmatter. Ensure "astro.frontmatter" is set to a valid JSON object that is not `null` or `undefined`.'
			);
		const { frontmatter } = astroData;
		const exportNodes = [
			jsToTreeNode(`export const frontmatter = ${JSON.stringify(frontmatter)};`),
		];
		if (frontmatter.layout) {
			// NOTE(bholmesdev) 08-22-2022
			// Using an async layout import (i.e. `const Layout = (await import...)`)
			// Preserves the dev server import cache when globbing a large set of MDX files
			// Full explanation: 'https://github.com/withastro/astro/pull/4428'
			exportNodes.unshift(
				jsToTreeNode(
					/** @see 'vite-plugin-markdown' for layout props reference */
					`import { jsx as layoutJsx } from 'astro/jsx-runtime';

				export default async function ({ children }) {
					const Layout = (await import(${JSON.stringify(frontmatter.layout)})).default;
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;
					return layoutJsx(Layout, {
						file,
						url,
						content,
						frontmatter: content,
						headings: getHeadings(),
						'server:root': true,
						children,
					});
				};`
				)
			);
		}
		tree.children = exportNodes.concat(tree.children);
	};
}

/**
 * `src/content/` does not support relative image paths.
 * This plugin throws an error if any are found
 */
function toRemarkContentRelImageError({ srcDir }: { srcDir: URL }) {
	const contentDir = new URL('content/', srcDir);
	return function remarkContentRelImageError() {
		return (tree: any, vfile: VFile) => {
			const isContentFile = pathToFileURL(vfile.path).href.startsWith(contentDir.href);
			if (!isContentFile) return;

			const relImagePaths = new Set<string>();
			visit(tree, 'image', function raiseError(node: Image) {
				if (isRelativePath(node.url)) {
					relImagePaths.add(node.url);
				}
			});
			if (relImagePaths.size === 0) return;

			const errorMessage =
				`Relative image paths are not supported in the content/ directory. Place local images in the public/ directory and use absolute paths (see https://docs.astro.build/en/guides/images/#in-markdown-files):\n` +
				[...relImagePaths].map((path) => JSON.stringify(path)).join(',\n');

			throw new Error(errorMessage);
		};
	};
}

export async function getRemarkPlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): Promise<MdxRollupPluginOptions['remarkPlugins']> {
	let remarkPlugins: PluggableList = [];

	if (mdxOptions.gfm) {
		remarkPlugins.push(remarkGfm);
	}
	if (mdxOptions.smartypants) {
		remarkPlugins.push(remarkSmartypants);
	}

	remarkPlugins = [...remarkPlugins, ...ignoreStringPlugins(mdxOptions.remarkPlugins)];

	// Apply syntax highlighters after user plugins to match `markdown/remark` behavior
	if (mdxOptions.syntaxHighlight === 'shiki') {
		remarkPlugins.push([await remarkShiki(mdxOptions.shikiConfig)]);
	}
	if (mdxOptions.syntaxHighlight === 'prism') {
		remarkPlugins.push(remarkPrism);
	}

	// Apply last in case user plugins resolve relative image paths
	remarkPlugins.push(toRemarkContentRelImageError(config));

	return remarkPlugins;
}

export function getRehypePlugins(mdxOptions: MdxOptions): MdxRollupPluginOptions['rehypePlugins'] {
	let rehypePlugins: PluggableList = [
		// ensure `data.meta` is preserved in `properties.metastring` for rehype syntax highlighters
		rehypeMetaString,
		// rehypeRaw allows custom syntax highlighters to work without added config
		[rehypeRaw, { passThrough: nodeTypes }] as any,
	];

	rehypePlugins = [
		...rehypePlugins,
		...ignoreStringPlugins(mdxOptions.rehypePlugins),
		// getHeadings() is guaranteed by TS, so this must be included.
		// We run `rehypeHeadingIds` _last_ to respect any custom IDs set by user plugins.
		rehypeHeadingIds,
		rehypeInjectHeadingsExport,
		// computed from `astro.data.frontmatter` in VFile data
		rehypeApplyFrontmatterExport,
	];
	return rehypePlugins;
}

function ignoreStringPlugins(plugins: any[]) {
	let validPlugins: PluggableList = [];
	let hasInvalidPlugin = false;
	for (const plugin of plugins) {
		if (typeof plugin === 'string') {
			console.warn(yellow(`[MDX] ${bold(plugin)} not applied.`));
			hasInvalidPlugin = true;
		} else if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
			console.warn(yellow(`[MDX] ${bold(plugin[0])} not applied.`));
			hasInvalidPlugin = true;
		} else {
			validPlugins.push(plugin);
		}
	}
	if (hasInvalidPlugin) {
		console.warn(
			`To inherit Markdown plugins in MDX, please use explicit imports in your config instead of "strings." See Markdown docs: https://docs.astro.build/en/guides/markdown-content/#markdown-plugins`
		);
	}
	return validPlugins;
}

/**
 * Check if estree entry is "import.meta.env.VARIABLE"
 * If it is, return the variable name (i.e. "VARIABLE")
 */
function getImportMetaEnvVariableName(node: MemberExpression): string | Error {
	try {
		// check for ".[ANYTHING]"
		if (node.object.type !== 'MemberExpression' || node.property.type !== 'Identifier')
			return new Error();

		const nestedExpression = node.object;
		// check for ".env"
		if (nestedExpression.property.type !== 'Identifier' || nestedExpression.property.name !== 'env')
			return new Error();

		const envExpression = nestedExpression.object;
		// check for ".meta"
		if (
			envExpression.type !== 'MetaProperty' ||
			envExpression.property.type !== 'Identifier' ||
			envExpression.property.name !== 'meta'
		)
			return new Error();

		// check for "import"
		if (envExpression.meta.name !== 'import') return new Error();

		return node.property.name;
	} catch (e) {
		if (e instanceof Error) {
			return e;
		}
		return new Error('Unknown parsing error');
	}
}
