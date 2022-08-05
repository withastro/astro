import type { MarkdownRenderingOptions, MarkdownRenderingResult } from './types';

import { loadPlugins } from './load-plugins.js';
import createCollectHeadings from './rehype-collect-headings.js';
import rehypeEscape from './rehype-escape.js';
import rehypeExpressions from './rehype-expressions.js';
import rehypeIslands from './rehype-islands.js';
import rehypeJsx from './rehype-jsx.js';
import remarkEscape from './remark-escape.js';
import { remarkInitializeAstroData } from './remark-initialize-astro-data.js';
import remarkMarkAndUnravel from './remark-mark-and-unravel.js';
import remarkMdxish from './remark-mdxish.js';
import remarkPrism from './remark-prism.js';
import scopedStyles from './remark-scoped-styles.js';
import remarkShiki from './remark-shiki.js';
import remarkUnwrap from './remark-unwrap.js';

import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import markdown from 'remark-parse';
import markdownToHtml from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';

export * from './types.js';

export const DEFAULT_REMARK_PLUGINS = ['remark-gfm', 'remark-smartypants'];
export const DEFAULT_REHYPE_PLUGINS = [];

/** Shared utility for rendering markdown */
export async function renderMarkdown(
	content: string,
	opts: MarkdownRenderingOptions
): Promise<MarkdownRenderingResult> {
	let {
		fileURL,
		syntaxHighlight = 'shiki',
		shikiConfig = {},
		remarkPlugins = [],
		rehypePlugins = [],
		isAstroFlavoredMd = false,
	} = opts;
	const input = new VFile({ value: content, path: fileURL });
	const scopedClassName = opts.$?.scopedClassName;
	const { headings, rehypeCollectHeadings } = createCollectHeadings();

	let parser = unified()
		.use(markdown)
		.use(remarkInitializeAstroData)
		.use(isAstroFlavoredMd ? [remarkMdxish, remarkMarkAndUnravel, remarkUnwrap, remarkEscape] : []);

	if (remarkPlugins.length === 0 && rehypePlugins.length === 0) {
		remarkPlugins = [...DEFAULT_REMARK_PLUGINS];
		rehypePlugins = [...DEFAULT_REHYPE_PLUGINS];
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

	parser.use([
		[
			markdownToHtml as any,
			{
				allowDangerousHtml: true,
				passThrough: isAstroFlavoredMd
					? [
							'raw',
							'mdxFlowExpression',
							'mdxJsxFlowElement',
							'mdxJsxTextElement',
							'mdxTextExpression',
					  ]
					: [],
			},
		],
	]);

	loadedRehypePlugins.forEach(([plugin, pluginOpts]) => {
		parser.use([[plugin, pluginOpts]]);
	});

	parser
		.use(
			isAstroFlavoredMd
				? [rehypeJsx, rehypeExpressions, rehypeEscape, rehypeIslands, rehypeCollectHeadings]
				: [rehypeCollectHeadings, rehypeRaw]
		)
		.use(rehypeStringify, { allowDangerousHtml: true });

	let vfile: VFile;
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
