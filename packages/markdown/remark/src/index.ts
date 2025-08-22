import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkSmartypants from 'remark-smartypants';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { defaultExcludeLanguages } from './highlight.js';
import { loadPlugins } from './load-plugins.js';
import { rehypeHeadingIds } from './rehype-collect-headings.js';
import { rehypeImages } from './rehype-images.js';
import { rehypePrism } from './rehype-prism.js';
import { rehypeShiki } from './rehype-shiki.js';
import { remarkCollectImages } from './remark-collect-images.js';
import type {
	AstroMarkdownOptions,
	AstroMarkdownProcessorOptions,
	MarkdownProcessor,
	SyntaxHighlightConfig,
} from './types.js';

export {
	extractFrontmatter,
	isFrontmatterValid,
	type ParseFrontmatterOptions,
	type ParseFrontmatterResult,
	parseFrontmatter,
} from './frontmatter.js';
export { rehypeHeadingIds } from './rehype-collect-headings.js';
export { rehypePrism } from './rehype-prism.js';
export { rehypeShiki } from './rehype-shiki.js';
export { remarkCollectImages } from './remark-collect-images.js';
export {
	type CreateShikiHighlighterOptions,
	createShikiHighlighter,
	type ShikiHighlighter,
	type ShikiHighlighterHighlightOptions,
} from './shiki.js';
export * from './types.js';

export const syntaxHighlightDefaults: Required<SyntaxHighlightConfig> = {
	type: 'shiki',
	excludeLangs: defaultExcludeLanguages,
};

export const markdownConfigDefaults: Required<AstroMarkdownOptions> = {
	syntaxHighlight: syntaxHighlightDefaults,
	shikiConfig: {
		langs: [],
		theme: 'github-dark',
		themes: {},
		wrap: false,
		transformers: [],
		langAlias: {},
	},
	remarkPlugins: [],
	rehypePlugins: [],
	remarkRehype: {},
	gfm: true,
	smartypants: true,
};

// Skip nonessential plugins during performance benchmark runs
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);

/**
 * Create a markdown preprocessor to render multiple markdown files
 */
export async function createMarkdownProcessor(
	opts?: AstroMarkdownProcessorOptions,
): Promise<MarkdownProcessor> {
	const {
		syntaxHighlight = markdownConfigDefaults.syntaxHighlight,
		shikiConfig = markdownConfigDefaults.shikiConfig,
		remarkPlugins = markdownConfigDefaults.remarkPlugins,
		rehypePlugins = markdownConfigDefaults.rehypePlugins,
		remarkRehype: remarkRehypeOptions = markdownConfigDefaults.remarkRehype,
		gfm = markdownConfigDefaults.gfm,
		smartypants = markdownConfigDefaults.smartypants,
		experimentalHeadingIdCompat = false,
	} = opts ?? {};

	const loadedRemarkPlugins = await Promise.all(loadPlugins(remarkPlugins));
	const loadedRehypePlugins = await Promise.all(loadPlugins(rehypePlugins));

	const parser = unified().use(remarkParse);

	// gfm and smartypants
	if (!isPerformanceBenchmark) {
		if (gfm) {
			parser.use(remarkGfm);
		}
		if (smartypants) {
			parser.use(remarkSmartypants);
		}
	}

	// User remark plugins
	for (const [plugin, pluginOpts] of loadedRemarkPlugins) {
		parser.use(plugin, pluginOpts);
	}

	if (!isPerformanceBenchmark) {
		// Apply later in case user plugins resolve relative image paths
		parser.use(remarkCollectImages, opts?.image);
	}

	// Remark -> Rehype
	parser.use(remarkRehype, {
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
			parser.use(rehypeShiki, shikiConfig, excludeLangs);
		} else if (syntaxHighlightType === 'prism') {
			parser.use(rehypePrism, excludeLangs);
		}
	}

	// User rehype plugins
	for (const [plugin, pluginOpts] of loadedRehypePlugins) {
		parser.use(plugin, pluginOpts);
	}

	// Images / Assets support
	parser.use(rehypeImages);

	// Headings
	if (!isPerformanceBenchmark) {
		parser.use(rehypeHeadingIds, { experimentalHeadingIdCompat });
	}

	// Stringify to HTML
	parser.use(rehypeRaw).use(rehypeStringify, { allowDangerousHtml: true });

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

			const result = await parser.process(vfile).catch((err) => {
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
