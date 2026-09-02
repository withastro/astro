import { markdownConfigDefaults } from '@astrojs/internal-helpers/markdown';
import {
	getBuildTimings,
	pluggableName,
	timeAsync,
	timedPlugin,
	timeSync,
} from '@astrojs/internal-helpers/timings';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkSmartypants from 'remark-smartypants';
import { type Plugin, unified } from 'unified';
import { VFile } from 'vfile';
import { loadPlugins } from './load-plugins.js';
import { rehypeHeadingIds } from './rehype-collect-headings.js';
import { rehypeImages } from './rehype-images.js';
import { rehypePrism } from './rehype-prism.js';
import { rehypeShiki } from './rehype-shiki.js';
import { remarkCollectImages } from './remark-collect-images.js';
import type {
	AstroMarkdownOptions,
	MarkdownHeading,
	MarkdownRenderer,
} from '@astrojs/internal-helpers/markdown';

// `vfile.data.astro` is populated by the unified pipeline as it renders.
declare module 'vfile' {
	interface DataMap {
		astro: {
			headings?: MarkdownHeading[];
			localImagePaths?: string[];
			remoteImagePaths?: string[];
			frontmatter?: Record<string, any>;
		};
	}
}

export type { Node } from 'unist';
// The markdown contract types live in `@astrojs/internal-helpers/markdown`;
// re-exported so consumers keep a single import surface.
export type {
	AstroMarkdownOptions,
	MarkdownHeading,
	MarkdownProcessor,
	MarkdownRenderer,
	MarkdownRenderOptions,
	MarkdownRenderResult,
	RehypePlugin,
	RehypePlugins,
	RemarkPlugin,
	RemarkPlugins,
	RemarkRehype,
	ShikiConfig,
	Smartypants,
	SyntaxHighlightConfig,
	SyntaxHighlightConfigType,
} from '@astrojs/internal-helpers/markdown';
export {
	extractFrontmatter,
	isFrontmatterValid,
	type ParseFrontmatterOptions,
	type ParseFrontmatterResult,
	parseFrontmatter,
} from '@astrojs/internal-helpers/frontmatter';
export { rehypeHeadingIds } from './rehype-collect-headings.js';
export { rehypePrism } from './rehype-prism.js';
export { rehypeShiki } from './rehype-shiki.js';
export { remarkCollectImages } from './remark-collect-images.js';
export {
	isUnifiedProcessor,
	type UnifiedProcessorOptions,
	type UnifiedResolvedOptions,
	unified,
} from './processor.js';
export {
	markdownConfigDefaults,
	syntaxHighlightDefaults,
} from '@astrojs/internal-helpers/markdown';

// Skip nonessential plugins during performance benchmark runs
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);

/**
 * Create a markdown preprocessor to render multiple markdown files
 */
export async function createMarkdownProcessor(
	opts?: AstroMarkdownOptions,
): Promise<MarkdownRenderer> {
	const {
		syntaxHighlight = markdownConfigDefaults.syntaxHighlight,
		shikiConfig = markdownConfigDefaults.shikiConfig,
		remarkPlugins = markdownConfigDefaults.remarkPlugins,
		rehypePlugins = markdownConfigDefaults.rehypePlugins,
		remarkRehype: remarkRehypeOptions = markdownConfigDefaults.remarkRehype,
		gfm = markdownConfigDefaults.gfm,
		smartypants = markdownConfigDefaults.smartypants,
	} = opts ?? {};

	const loadedRemarkPlugins = await Promise.all(loadPlugins(remarkPlugins));
	const loadedRehypePlugins = await Promise.all(loadPlugins(rehypePlugins));

	const timed = <T extends Plugin<any[], any>>(name: string, plugin: T): T =>
		timedPlugin('markdown-plugin', name, plugin);

	const parser = unified().use(remarkParse);

	// gfm and smartypants
	if (!isPerformanceBenchmark) {
		if (gfm) {
			parser.use(timed('remark-gfm', remarkGfm));
		}
		if (smartypants !== false) {
			const smartypantsConfig = typeof smartypants === 'object' ? smartypants : {};
			parser.use(timed('remark-smartypants', remarkSmartypants), smartypantsConfig);
		}
	}

	// User remark plugins
	for (const [index, [plugin, pluginOpts]] of loadedRemarkPlugins.entries()) {
		parser.use(
			timed(pluggableName(remarkPlugins[index], index, 'remark plugin'), plugin),
			pluginOpts,
		);
	}

	if (!isPerformanceBenchmark) {
		// Apply later in case user plugins resolve relative image paths
		parser.use(timed('remark-collect-images', remarkCollectImages), opts?.image);
	}

	// Remark -> Rehype
	parser.use(timed('remark-rehype', remarkRehype), {
		allowDangerousHtml: true,
		passThrough: [],
		...remarkRehypeOptions,
	});

	if (syntaxHighlight && !isPerformanceBenchmark) {
		const syntaxHighlightType =
			typeof syntaxHighlight === 'string' ? syntaxHighlight : syntaxHighlight?.type;
		const excludeLangs =
			typeof syntaxHighlight === 'object' ? syntaxHighlight?.excludeLangs : undefined;
		// Syntax highlighting
		if (syntaxHighlightType === 'shiki') {
			parser.use(timed('rehype-shiki', rehypeShiki), shikiConfig, excludeLangs);
		} else if (syntaxHighlightType === 'prism') {
			parser.use(timed('rehype-prism', rehypePrism), excludeLangs);
		}
	}

	// User rehype plugins
	for (const [index, [plugin, pluginOpts]] of loadedRehypePlugins.entries()) {
		parser.use(
			timed(pluggableName(rehypePlugins[index], index, 'rehype plugin'), plugin),
			pluginOpts,
		);
	}

	// Images / Assets support
	parser.use(timed('rehype-images', rehypeImages));

	// Headings
	if (!isPerformanceBenchmark) {
		parser.use(timed('rehype-heading-ids', rehypeHeadingIds));
	}

	// Stringify to HTML
	parser.use(timed('rehype-raw', rehypeRaw)).use(rehypeStringify, { allowDangerousHtml: true });

	if (getBuildTimings()) {
		instrumentParseAndStringify(parser);
	}

	return {
		async render(content, renderOpts) {
			const vfile = new VFile({
				value: content,
				path: renderOpts?.fileURL,
				data: {
					astro: {
						frontmatter: renderOpts?.frontmatter ?? {},
					},
				},
			});

			const result = await timeAsync('markdown-file', String(vfile.path ?? 'unknown'), () =>
				parser.process(vfile),
			).catch((err) => {
				// Ensure that the error message contains the input filename
				// to make it easier for the user to fix the issue
				err = prefixError(err, `Failed to parse Markdown file "${vfile.path}"`);
				console.error(err);
				throw err;
			});

			return {
				code: String(result.value),
				metadata: {
					headings: result.data.astro?.headings ?? [],
					localImagePaths: result.data.astro?.localImagePaths ?? [],
					remoteImagePaths: result.data.astro?.remoteImagePaths ?? [],
					frontmatter: result.data.astro?.frontmatter ?? {},
				},
			};
		},
	};
}

/** Parse and stringify are not transformers, so `timedPlugin` cannot reach them. */
function instrumentParseAndStringify(processor: any): void {
	// Attachers install `parser`/`compiler` on freeze, so they only exist to swap afterwards.
	processor.freeze();

	const parse = processor.parser;
	if (typeof parse === 'function') {
		processor.parser = function (this: unknown, document: string, file: unknown) {
			return timeSync('markdown-plugin', 'remark-parse', () => parse.call(this, document, file));
		};
	}

	const stringify = processor.compiler;
	if (typeof stringify === 'function') {
		processor.compiler = function (this: unknown, tree: unknown, file: unknown) {
			return timeSync('markdown-plugin', 'rehype-stringify', () =>
				stringify.call(this, tree, file),
			);
		};
	}
}

function prefixError(err: any, prefix: string) {
	// If the error is an object with a `message` property, attempt to prefix the message
	if (err?.message) {
		try {
			err.message = `${prefix}:\n${err.message}`;
			return err;
		} catch {
			// Any errors here are ok, there's fallback code below
		}
	}

	// If that failed, create a new error with the desired message and attempt to keep the stack
	const wrappedError = new Error(`${prefix}${err ? `: ${err}` : ''}`);
	try {
		wrappedError.stack = err.stack;
		wrappedError.cause = err;
	} catch {
		// It's ok if we could not set the stack or cause - the message is the most important part
	}

	return wrappedError;
}
