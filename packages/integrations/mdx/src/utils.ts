import { nodeTypes } from '@mdx-js/mdx';
import type { PluggableList } from '@mdx-js/mdx/lib/core.js';
import type { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { Options as AcornOpts } from 'acorn';
import { parse } from 'acorn';
import type { AstroConfig, SSRError } from 'astro';
import matter from 'gray-matter';
import { bold, yellow } from 'kleur/colors';
import type { MdxjsEsm } from 'mdast-util-mdx';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { remarkInitializeAstroData } from './astro-data-utils.js';
import rehypeCollectHeadings from './rehype-collect-headings.js';
import remarkPrism from './remark-prism.js';
import remarkShiki from './remark-shiki.js';

export type MdxOptions = {
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
	/**
	 * Choose which remark and rehype plugins to inherit, if any.
	 *
	 * - "markdown" (default) - inherit your project’s markdown plugin config ([see Markdown docs](https://docs.astro.build/en/guides/markdown-content/#configuring-markdown))
	 * - "astroDefaults" - inherit Astro’s default plugins only ([see defaults](https://docs.astro.build/en/reference/configuration-reference/#markdownextenddefaultplugins))
	 * - false - do not inherit any plugins
	 */
	extendPlugins?: 'markdown' | 'astroDefaults' | false;
};

function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

interface FileInfo {
	fileId: string;
	fileUrl: string;
}

const DEFAULT_REMARK_PLUGINS: PluggableList = [remarkGfm, remarkSmartypants];
const DEFAULT_REHYPE_PLUGINS: PluggableList = [];

/** @see 'vite-plugin-utils' for source */
export function getFileInfo(id: string, config: AstroConfig): FileInfo {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base
	);

	// Try to grab the file's actual URL
	let url: URL | undefined = undefined;
	try {
		url = new URL(`file://${id}`);
	} catch {}

	const fileId = id.split('?')[0];
	let fileUrl: string;
	const isPage = fileId.includes('/pages/');
	if (isPage) {
		fileUrl = fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(\/index)?\.mdx$/, '');
	} else if (url && url.pathname.startsWith(config.root.pathname)) {
		fileUrl = url.pathname.slice(config.root.pathname.length);
	} else {
		fileUrl = fileId;
	}

	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	return { fileId, fileUrl };
}

/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
export function parseFrontmatter(code: string, id: string) {
	try {
		return matter(code);
	} catch (e: any) {
		if (e.name === 'YAMLException') {
			const err: SSRError = e;
			err.id = id;
			err.loc = { file: e.id, line: e.mark.line + 1, column: e.mark.column };
			err.message = e.reason;
			throw err;
		} else {
			throw e;
		}
	}
}

export function jsToTreeNode(
	jsString: string,
	acornOpts: AcornOpts = {
		ecmaVersion: 'latest',
		sourceType: 'module',
	}
): MdxjsEsm {
	return {
		type: 'mdxjsEsm',
		value: '',
		data: {
			estree: {
				body: [],
				...parse(jsString, acornOpts),
				type: 'Program',
				sourceType: 'module',
			},
		},
	};
}

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

// TODO: remove for 1.0
export function handleExtendsNotSupported(pluginConfig: any) {
	if (
		typeof pluginConfig === 'object' &&
		pluginConfig !== null &&
		(pluginConfig as any).hasOwnProperty('extends')
	) {
		throw new Error(
			`[MDX] The "extends" plugin option is no longer supported! Astro now extends your project's \`markdown\` plugin configuration by default. To customize this behavior, see the \`extendPlugins\` option instead: https://docs.astro.build/en/guides/integrations-guide/mdx/#extendplugins`
		);
	}
}
