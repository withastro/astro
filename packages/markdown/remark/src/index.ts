import type { AstroMarkdownOptions, MarkdownRenderingOptions } from './types';

import createCollectHeaders from './rehype-collect-headers.js';
import scopedStyles from './remark-scoped-styles.js';
import { remarkExpressions, loadRemarkExpressions } from './remark-expressions.js';
import rehypeExpressions from './rehype-expressions.js';
import rehypeIslands from './rehype-islands.js';
import { remarkJsx, loadRemarkJsx } from './remark-jsx.js';
import rehypeJsx from './rehype-jsx.js';
import rehypeEscape from './rehype-escape.js';
import remarkPrism from './remark-prism.js';
import remarkUnwrap from './remark-unwrap.js';
import { loadPlugins } from './load-plugins.js';

import { unified } from 'unified';
import markdown from 'remark-parse';
import markdownToHtml from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import matter from 'gray-matter';

export { AstroMarkdownOptions, MarkdownRenderingOptions };

/** Internal utility for rendering a full markdown file and extracting Frontmatter data */
export async function renderMarkdownWithFrontmatter(contents: string, opts?: MarkdownRenderingOptions | null) {
	const { data: frontmatter, content } = matter(contents);
	const value = await renderMarkdown(content, opts);
	return { ...value, frontmatter };
}

export const DEFAULT_REMARK_PLUGINS = ['remark-gfm', 'remark-smartypants'];

export const DEFAULT_REHYPE_PLUGINS = ['rehype-slug'];

/** Shared utility for rendering markdown */
export async function renderMarkdown(content: string, opts?: MarkdownRenderingOptions | null) {
	let { remarkPlugins = [], rehypePlugins = [] } = opts ?? {};
	const scopedClassName = opts?.$?.scopedClassName;
	const mode = opts?.mode ?? 'mdx';
	const isMDX = mode === 'mdx';
	const { headers, rehypeCollectHeaders } = createCollectHeaders();

	await Promise.all([loadRemarkExpressions(), loadRemarkJsx()]); // Vite bug: dynamically import() these because of CJS interop (this will cache)

	let parser = unified()
		.use(markdown)
		.use(isMDX ? [remarkJsx] : [])
		.use(isMDX ? [remarkExpressions] : [])
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

	parser.use([remarkPrism(scopedClassName)]);
	parser.use([[markdownToHtml as any, { allowDangerousHtml: true, passThrough: ['raw', 'mdxTextExpression', 'mdxJsxTextElement', 'mdxJsxFlowElement'] }]]);

	loadedRehypePlugins.forEach(([plugin, opts]) => {
		parser.use([[plugin, opts]]);
	});

	parser
		.use(isMDX ? [rehypeJsx] : [])
		.use(isMDX ? [rehypeExpressions] : [])
		.use(isMDX ? [] : [rehypeRaw])
		.use(isMDX ? [rehypeEscape] : [])
		.use(rehypeIslands);

	let result: string;
	try {
		const vfile = await parser.use([rehypeCollectHeaders]).use(rehypeStringify, { allowDangerousHtml: true }).process(content);
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

export default renderMarkdownWithFrontmatter;
