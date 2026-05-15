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
import { extractFrontmatter, isFrontmatterValid, parseFrontmatter } from './frontmatter.js';
import { rehypeHeadingIds as rehypeHeadingIds2 } from './rehype-collect-headings.js';
import { rehypePrism as rehypePrism2 } from './rehype-prism.js';
import { rehypeShiki as rehypeShiki2 } from './rehype-shiki.js';
import { remarkCollectImages as remarkCollectImages2 } from './remark-collect-images.js';
import { createShikiHighlighter } from './shiki.js';
export * from './types.js';
const syntaxHighlightDefaults = {
	type: 'shiki',
	excludeLangs: defaultExcludeLanguages,
};
const markdownConfigDefaults = {
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
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);
async function createMarkdownProcessor(opts) {
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
	if (!isPerformanceBenchmark) {
		if (gfm) {
			parser.use(remarkGfm);
		}
		if (smartypants !== false) {
			const smartypantsConfig = typeof smartypants === 'object' ? smartypants : {};
			parser.use(remarkSmartypants, smartypantsConfig);
		}
	}
	for (const [plugin, pluginOpts] of loadedRemarkPlugins) {
		parser.use(plugin, pluginOpts);
	}
	if (!isPerformanceBenchmark) {
		parser.use(remarkCollectImages, opts?.image);
	}
	parser.use(remarkRehype, {
		allowDangerousHtml: true,
		passThrough: [],
		...remarkRehypeOptions,
	});
	if (syntaxHighlight && !isPerformanceBenchmark) {
		const syntaxHighlightType =
			typeof syntaxHighlight === 'string' ? syntaxHighlight : syntaxHighlight?.type;
		const excludeLangs =
			typeof syntaxHighlight === 'object' ? syntaxHighlight?.excludeLangs : void 0;
		if (syntaxHighlightType === 'shiki') {
			parser.use(rehypeShiki, shikiConfig, excludeLangs);
		} else if (syntaxHighlightType === 'prism') {
			parser.use(rehypePrism, excludeLangs);
		}
	}
	for (const [plugin, pluginOpts] of loadedRehypePlugins) {
		parser.use(plugin, pluginOpts);
	}
	parser.use(rehypeImages);
	if (!isPerformanceBenchmark) {
		parser.use(rehypeHeadingIds);
	}
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
function prefixError(err, prefix) {
	if (err?.message) {
		try {
			err.message = `${prefix}:
${err.message}`;
			return err;
		} catch {}
	}
	const wrappedError = new Error(`${prefix}${err ? `: ${err}` : ''}`);
	try {
		wrappedError.stack = err.stack;
		wrappedError.cause = err;
	} catch {}
	return wrappedError;
}
export {
	createMarkdownProcessor,
	createShikiHighlighter,
	extractFrontmatter,
	isFrontmatterValid,
	markdownConfigDefaults,
	parseFrontmatter,
	rehypeHeadingIds2 as rehypeHeadingIds,
	rehypePrism2 as rehypePrism,
	rehypeShiki2 as rehypeShiki,
	remarkCollectImages2 as remarkCollectImages,
	syntaxHighlightDefaults,
};
