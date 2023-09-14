import type {
	AstroMarkdownOptions,
	MarkdownProcessor,
	MarkdownRenderingOptions,
	MarkdownRenderingResult,
	MarkdownVFile,
} from './types.js';

import {
	InvalidAstroDataError,
	safelyGetAstroData,
	setAstroData,
} from './frontmatter-injection.js';
import { loadPlugins } from './load-plugins.js';
import { rehypeHeadingIds } from './rehype-collect-headings.js';
import { remarkCollectImages } from './remark-collect-images.js';
import { remarkPrism } from './remark-prism.js';
import { remarkShiki } from './remark-shiki.js';

import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkSmartypants from 'remark-smartypants';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { rehypeImages } from './rehype-images.js';

export { InvalidAstroDataError } from './frontmatter-injection.js';
export { rehypeHeadingIds } from './rehype-collect-headings.js';
export { remarkCollectImages } from './remark-collect-images.js';
export { remarkPrism } from './remark-prism.js';
export { remarkShiki } from './remark-shiki.js';
export * from './types.js';

export const markdownConfigDefaults: Omit<Required<AstroMarkdownOptions>, 'drafts'> = {
	syntaxHighlight: 'shiki',
	shikiConfig: {
		langs: [],
		theme: 'github-dark',
		wrap: false,
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
	opts?: AstroMarkdownOptions
): Promise<MarkdownProcessor> {
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
		// Syntax highlighting
		if (syntaxHighlight === 'shiki') {
			parser.use(remarkShiki, shikiConfig);
		} else if (syntaxHighlight === 'prism') {
			parser.use(remarkPrism);
		}

		// Apply later in case user plugins resolve relative image paths
		parser.use(remarkCollectImages);
	}

	// Remark -> Rehype
	parser.use(remarkRehype as any, {
		allowDangerousHtml: true,
		passThrough: [],
		...remarkRehypeOptions,
	});

	// User rehype plugins
	for (const [plugin, pluginOpts] of loadedRehypePlugins) {
		parser.use(plugin, pluginOpts);
	}

	// Images / Assets support
	parser.use(rehypeImages());

	// Headings
	if (!isPerformanceBenchmark) {
		parser.use(rehypeHeadingIds);
	}

	// Stringify to HTML
	parser.use(rehypeRaw).use(rehypeStringify, { allowDangerousHtml: true });

	return {
		async render(content, renderOpts) {
			const vfile = new VFile({ value: content, path: renderOpts?.fileURL });
			setAstroData(vfile.data, { frontmatter: renderOpts?.frontmatter ?? {} });

			const result: MarkdownVFile = await parser.process(vfile).catch((err) => {
				// Ensure that the error message contains the input filename
				// to make it easier for the user to fix the issue
				err = prefixError(err, `Failed to parse Markdown file "${vfile.path}"`);
				// eslint-disable-next-line no-console
				console.error(err);
				throw err;
			});

			const astroData = safelyGetAstroData(result.data);
			if (astroData instanceof InvalidAstroDataError) {
				throw astroData;
			}

			return {
				code: String(result.value),
				metadata: {
					headings: result.data.__astroHeadings ?? [],
					imagePaths: result.data.imagePaths ?? new Set(),
					frontmatter: astroData.frontmatter ?? {},
				},
				// Compat for `renderMarkdown` only. Do not use!
				__renderMarkdownCompat: {
					result,
				},
			};
		},
	};
}

/**
 * Shared utility for rendering markdown
 *
 * @deprecated Use `createMarkdownProcessor` instead for better performance
 */
export async function renderMarkdown(
	content: string,
	opts: MarkdownRenderingOptions
): Promise<MarkdownRenderingResult> {
	const processor = await createMarkdownProcessor(opts);

	const result = await processor.render(content, {
		fileURL: opts.fileURL,
		frontmatter: opts.frontmatter,
	});

	return {
		code: result.code,
		metadata: {
			headings: result.metadata.headings,
			source: content,
			html: result.code,
		},
		vfile: (result as any).__renderMarkdownCompat.result,
	};
}

function prefixError(err: any, prefix: string) {
	// If the error is an object with a `message` property, attempt to prefix the message
	if (err?.message) {
		try {
			err.message = `${prefix}:\n${err.message}`;
			return err;
		} catch (error) {
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
