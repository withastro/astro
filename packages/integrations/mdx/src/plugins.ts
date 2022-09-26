import { nodeTypes } from '@mdx-js/mdx';
import type { PluggableList } from '@mdx-js/mdx/lib/core.js';
import type { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroConfig, MarkdownAstroData } from 'astro';
import type { Literal, MemberExpression } from 'estree';
import { visit as estreeVisit } from 'estree-util-visit';
import { bold, yellow } from 'kleur/colors';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import type { Data, VFile } from 'vfile';
import { MdxOptions } from './index.js';
import rehypeCollectHeadings from './rehype-collect-headings.js';
import remarkPrism from './remark-prism.js';
import remarkShiki from './remark-shiki.js';
import { jsToTreeNode } from './utils.js';

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

export function remarkInitializeAstroData() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astro) {
			vfile.data.astro = { frontmatter: {} };
		}
	};
}

const EXPORT_NAME = 'frontmatter';

export function rehypeApplyFrontmatterExport(pageFrontmatter: Record<string, any>) {
	return function (tree: any, vfile: VFile) {
		const { frontmatter: injectedFrontmatter } = safelyGetAstroData(vfile.data);
		const frontmatter = { ...injectedFrontmatter, ...pageFrontmatter };
		const exportNodes = [
			jsToTreeNode(`export const ${EXPORT_NAME} = ${JSON.stringify(frontmatter)};`),
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
					content.astro = {};
					Object.defineProperty(content.astro, 'headings', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."')
						}
					});
					Object.defineProperty(content.astro, 'html', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."')
						}
					});
					Object.defineProperty(content.astro, 'source', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."')
						}
					});
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

const DEFAULT_REMARK_PLUGINS: PluggableList = [remarkGfm, remarkSmartypants];
const DEFAULT_REHYPE_PLUGINS: PluggableList = [];

export async function getRemarkPlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): Promise<MdxRollupPluginOptions['remarkPlugins']> {
	let remarkPlugins: PluggableList = [
		// Set "vfile.data.astro" for plugins to inject frontmatter
		remarkInitializeAstroData,
	];
	switch (mdxOptions.extendPlugins) {
		case false:
			break;
		case 'astroDefaults':
			remarkPlugins = [...remarkPlugins, ...DEFAULT_REMARK_PLUGINS];
			break;
		default:
			remarkPlugins = [
				...remarkPlugins,
				...(markdownShouldExtendDefaultPlugins(config) ? DEFAULT_REMARK_PLUGINS : []),
				...ignoreStringPlugins(config.markdown.remarkPlugins ?? []),
			];
			break;
	}
	if (config.markdown.syntaxHighlight === 'shiki') {
		remarkPlugins.push([await remarkShiki(config.markdown.shikiConfig)]);
	}
	if (config.markdown.syntaxHighlight === 'prism') {
		remarkPlugins.push(remarkPrism);
	}

	remarkPlugins = [...remarkPlugins, ...(mdxOptions.remarkPlugins ?? [])];
	return remarkPlugins;
}

export function getRehypePlugins(
	mdxOptions: MdxOptions,
	config: AstroConfig
): MdxRollupPluginOptions['rehypePlugins'] {
	let rehypePlugins: PluggableList = [
		// getHeadings() is guaranteed by TS, so we can't allow user to override
		rehypeCollectHeadings,
		// rehypeRaw allows custom syntax highlighters to work without added config
		[rehypeRaw, { passThrough: nodeTypes }] as any,
	];
	switch (mdxOptions.extendPlugins) {
		case false:
			break;
		case 'astroDefaults':
			rehypePlugins = [...rehypePlugins, ...DEFAULT_REHYPE_PLUGINS];
			break;
		default:
			rehypePlugins = [
				...rehypePlugins,
				...(markdownShouldExtendDefaultPlugins(config) ? DEFAULT_REHYPE_PLUGINS : []),
				...ignoreStringPlugins(config.markdown.rehypePlugins ?? []),
			];
			break;
	}

	rehypePlugins = [...rehypePlugins, ...(mdxOptions.rehypePlugins ?? [])];
	return rehypePlugins;
}

function markdownShouldExtendDefaultPlugins(config: AstroConfig): boolean {
	return (
		config.markdown.extendDefaultPlugins ||
		(config.markdown.remarkPlugins.length === 0 && config.markdown.rehypePlugins.length === 0)
	);
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
 * Copied from markdown utils
 * @see "vite-plugin-utils"
 */
function isValidAstroData(obj: unknown): obj is MarkdownAstroData {
	if (typeof obj === 'object' && obj !== null && obj.hasOwnProperty('frontmatter')) {
		const { frontmatter } = obj as any;
		try {
			// ensure frontmatter is JSON-serializable
			JSON.stringify(frontmatter);
		} catch {
			return false;
		}
		return typeof frontmatter === 'object' && frontmatter !== null;
	}
	return false;
}

/**
 * Copied from markdown utils
 * @see "vite-plugin-utils"
 */
function safelyGetAstroData(vfileData: Data): MarkdownAstroData {
	const { astro } = vfileData;

	if (!astro) return { frontmatter: {} };
	if (!isValidAstroData(astro)) {
		throw Error(
			`[MDX] A remark or rehype plugin tried to add invalid frontmatter. Ensure "astro.frontmatter" is a JSON object!`
		);
	}

	return astro;
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
