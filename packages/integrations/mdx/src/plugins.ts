import { rehypeHeadingIds, remarkCollectImages } from '@astrojs/markdown-remark';
import {
	InvalidAstroDataError,
	safelyGetAstroData,
} from '@astrojs/markdown-remark/dist/internal.js';
import { nodeTypes } from '@mdx-js/mdx';
import type { PluggableList } from '@mdx-js/mdx/lib/core.js';
import type { AstroConfig } from 'astro';
import type { Literal, MemberExpression } from 'estree';
import { visit as estreeVisit } from 'estree-util-visit';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import type { VFile } from 'vfile';
import type { MdxOptions } from './index.js';
import { rehypeInjectHeadingsExport } from './rehype-collect-headings.js';
import rehypeMetaString from './rehype-meta-string.js';
import { rehypeOptimizeStatic } from './rehype-optimize-static.js';
import { remarkImageToComponent } from './remark-images-to-component.js';
import remarkPrism from './remark-prism.js';
import remarkShiki from './remark-shiki.js';
import { jsToTreeNode } from './utils.js';

// Skip nonessential plugins during performance benchmark runs
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);

export function recmaInjectImportMetaEnvPlugin({
	importMetaEnv,
}: {
	importMetaEnv: Record<string, any>;
}) {
	return (tree: any) => {
		estreeVisit(tree, (node) => {
			if (node.type === 'MemberExpression') {
				// attempt to get "import.meta.env" variable name
				const envVarName = getImportMetaEnvVariableName(node);
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

export async function getRemarkPlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): Promise<PluggableList> {
	let remarkPlugins: PluggableList = [
		...(config.experimental.assets ? [remarkCollectImages, remarkImageToComponent] : []),
	];

	if (!isPerformanceBenchmark) {
		if (mdxOptions.gfm) {
			remarkPlugins.push(remarkGfm);
		}
		if (mdxOptions.smartypants) {
			remarkPlugins.push(remarkSmartypants);
		}
	}

	remarkPlugins = [...remarkPlugins, ...mdxOptions.remarkPlugins];

	if (!isPerformanceBenchmark) {
		// Apply syntax highlighters after user plugins to match `markdown/remark` behavior
		if (mdxOptions.syntaxHighlight === 'shiki') {
			remarkPlugins.push([await remarkShiki(mdxOptions.shikiConfig)]);
		}
		if (mdxOptions.syntaxHighlight === 'prism') {
			remarkPlugins.push(remarkPrism);
		}
	}

	return remarkPlugins;
}

export function getRehypePlugins(mdxOptions: MdxOptions): PluggableList {
	let rehypePlugins: PluggableList = [
		// ensure `data.meta` is preserved in `properties.metastring` for rehype syntax highlighters
		rehypeMetaString,
		// rehypeRaw allows custom syntax highlighters to work without added config
		[rehypeRaw, { passThrough: nodeTypes }] as any,
	];

	rehypePlugins = [
		...rehypePlugins,
		...mdxOptions.rehypePlugins,
		// getHeadings() is guaranteed by TS, so this must be included.
		// We run `rehypeHeadingIds` _last_ to respect any custom IDs set by user plugins.
		...(isPerformanceBenchmark ? [] : [rehypeHeadingIds, rehypeInjectHeadingsExport]),
		// computed from `astro.data.frontmatter` in VFile data
		rehypeApplyFrontmatterExport,
	];

	if (mdxOptions.optimize) {
		// Convert user `optimize` option to compatible `rehypeOptimizeStatic` option
		const options = mdxOptions.optimize === true ? undefined : mdxOptions.optimize;
		rehypePlugins.push([rehypeOptimizeStatic, options]);
	}

	return rehypePlugins;
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
