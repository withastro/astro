import type { MarkdownRenderingOptions, MarkdownRenderingResult } from './types';

import createCollectHeaders from './rehype-collect-headers.js';
import scopedStyles from './remark-scoped-styles.js';
import rehypeExpressions from './rehype-expressions.js';
import rehypeIslands from './rehype-islands.js';
import remarkMdxish from './remark-mdxish.js';
import remarkMarkAndUnravel from './remark-mark-and-unravel.js';
import rehypeJsx from './rehype-jsx.js';
import rehypeEscape from './rehype-escape.js';
import remarkPrism from './remark-prism.js';
import remarkShiki from './remark-shiki.js';
import remarkUnwrap from './remark-unwrap.js';
import { loadPlugins } from './load-plugins.js';

import { unified } from 'unified';
import markdown from 'remark-parse';
import markdownToHtml from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import Slugger from 'github-slugger';
import { VFile } from 'vfile';

export * from './types.js';

export const DEFAULT_REMARK_PLUGINS = ['remark-gfm', 'remark-smartypants'];
export const DEFAULT_REHYPE_PLUGINS = [];

const slugger = new Slugger();
export function slug(value: string): string {
	return slugger.slug(value);
}

/** Shared utility for rendering markdown */
export async function renderMarkdown(
	content: string,
	opts: MarkdownRenderingOptions = {}
): Promise<MarkdownRenderingResult> {
	let {
		fileURL,
		mode = 'mdx',
		syntaxHighlight = 'shiki',
		shikiConfig = {},
		remarkPlugins = [],
		rehypePlugins = [],
	} = opts;
	const input = new VFile({ value: content, path: fileURL });
	const scopedClassName = opts.$?.scopedClassName;
	const isMDX = mode === 'mdx';
	const { headers, rehypeCollectHeaders } = createCollectHeaders();

	let parser = unified()
		.use(markdown)
		.use(isMDX ? [remarkMdxish, remarkMarkAndUnravel] : [])
		.use([remarkUnwrap]);

	if (remarkPlugins.length === 0 && rehypePlugins.length === 0) {
		remarkPlugins = [...DEFAULT_REMARK_PLUGINS];
		rehypePlugins = [...DEFAULT_REHYPE_PLUGINS];
	}

	const loadedRemarkPlugins = await Promise.all(loadPlugins(remarkPlugins));
	const loadedRehypePlugins = await Promise.all(loadPlugins(rehypePlugins));

	loadedRemarkPlugins.forEach(([plugin, opts]) => {
		parser.use([[plugin, opts]]);
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
				passThrough: [
					'raw',
					'mdxFlowExpression',
					'mdxJsxFlowElement',
					'mdxJsxTextElement',
					'mdxTextExpression',
				],
			},
		],
	]);

	loadedRehypePlugins.forEach(([plugin, opts]) => {
		parser.use([[plugin, opts]]);
	});

	parser
		.use(isMDX ? [rehypeJsx, rehypeExpressions] : [rehypeRaw])
		.use(rehypeEscape)
		.use(rehypeIslands);

	let result: string;
	try {
		const vfile = await parser
			.use([rehypeCollectHeaders])
			.use(rehypeStringify, { allowDangerousHtml: true })
			.process(input);
		result = vfile.toString();
	} catch (err) {
		console.error(err);
		throw err;
	}

	return {
		metadata: { headers, source: content, html: result.toString() },
		code: result.toString(),
	};
}
