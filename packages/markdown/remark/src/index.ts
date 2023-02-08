import type {
	AstroMarkdownOptions,
	MarkdownRenderingOptions,
	MarkdownRenderingResult,
	MarkdownVFile,
} from './types';

import { toRemarkInitializeAstroData } from './frontmatter-injection.js';
import { loadPlugins } from './load-plugins.js';
import { rehypeHeadingIds } from './rehype-collect-headings.js';
import toRemarkContentRelImageError from './remark-content-rel-image-error.js';
import remarkPrism from './remark-prism.js';
import scopedStyles from './remark-scoped-styles.js';
import remarkShiki from './remark-shiki.js';

import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import markdown from 'remark-parse';
import markdownToHtml from 'remark-rehype';
import remarkSmartypants from 'remark-smartypants';
import { unified } from 'unified';
import { VFile } from 'vfile';

export { rehypeHeadingIds } from './rehype-collect-headings.js';
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

/** Shared utility for rendering markdown */
export async function renderMarkdown(
	content: string,
	opts: MarkdownRenderingOptions
): Promise<MarkdownRenderingResult> {
	let {
		fileURL,
		syntaxHighlight = markdownConfigDefaults.syntaxHighlight,
		shikiConfig = markdownConfigDefaults.shikiConfig,
		remarkPlugins = markdownConfigDefaults.remarkPlugins,
		rehypePlugins = markdownConfigDefaults.rehypePlugins,
		remarkRehype = markdownConfigDefaults.remarkRehype,
		gfm = markdownConfigDefaults.gfm,
		smartypants = markdownConfigDefaults.smartypants,
		contentDir,
		frontmatter: userFrontmatter = {},
	} = opts;
	const input = new VFile({ value: content, path: fileURL });
	const scopedClassName = opts.$?.scopedClassName;

	let parser = unified()
		.use(markdown)
		.use(toRemarkInitializeAstroData({ userFrontmatter }))
		.use([]);

	if (gfm) {
		parser.use(remarkGfm);
	}

	if (smartypants) {
		parser.use(remarkSmartypants);
	}

	const loadedRemarkPlugins = await Promise.all(loadPlugins(remarkPlugins));
	const loadedRehypePlugins = await Promise.all(loadPlugins(rehypePlugins));

	loadedRemarkPlugins.forEach(([plugin, pluginOpts]) => {
		parser.use([[plugin, pluginOpts]]);
	});

	if (scopedClassName) {
		parser.use([scopedStyles(scopedClassName)]);
	}

	if (syntaxHighlight === 'shiki') {
		parser.use([await remarkShiki(shikiConfig, scopedClassName)]);
	} else if (syntaxHighlight === 'prism') {
		parser.use([remarkPrism(scopedClassName)]);
	}

	// Apply later in case user plugins resolve relative image paths
	parser.use([toRemarkContentRelImageError({ contentDir })]);

	parser.use([
		[
			markdownToHtml as any,
			{
				allowDangerousHtml: true,
				passThrough: [],
				...remarkRehype,
			},
		],
	]);

	loadedRehypePlugins.forEach(([plugin, pluginOpts]) => {
		parser.use([[plugin, pluginOpts]]);
	});

	parser.use([rehypeHeadingIds, rehypeRaw]).use(rehypeStringify, { allowDangerousHtml: true });

	let vfile: MarkdownVFile;
	try {
		vfile = await parser.process(input);
	} catch (err) {
		// Ensure that the error message contains the input filename
		// to make it easier for the user to fix the issue
		err = prefixError(err, `Failed to parse Markdown file "${input.path}"`);
		// eslint-disable-next-line no-console
		console.error(err);
		throw err;
	}

	const headings = vfile?.data.__astroHeadings || [];
	return {
		metadata: { headings, source: content, html: String(vfile.value) },
		code: String(vfile.value),
		vfile,
	};
}

function prefixError(err: any, prefix: string) {
	// If the error is an object with a `message` property, attempt to prefix the message
	if (err && err.message) {
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
		// @ts-ignore
		wrappedError.cause = err;
	} catch (error) {
		// It's ok if we could not set the stack or cause - the message is the most important part
	}

	return wrappedError;
}
