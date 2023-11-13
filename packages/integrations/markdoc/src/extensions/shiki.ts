import Markdoc from '@markdoc/markdoc';
import { createShikiHighlighter, type ShikiHighlighter } from '@astrojs/markdown-remark';
import type { ShikiConfig } from 'astro';
import { unescapeHTML } from 'astro/runtime/server/index.js';
import type { AstroMarkdocConfig } from '../config.js';

export default async function shiki(config?: ShikiConfig): Promise<AstroMarkdocConfig> {
	let highlighterAsync: Promise<ShikiHighlighter> | undefined;

	return {
		nodes: {
			fence: {
				attributes: Markdoc.nodes.fence.attributes!,
				async transform({ attributes }) {
					highlighterAsync ??= createShikiHighlighter(config);
					const highlighter = await highlighterAsync;

					const lang = typeof attributes.language === 'string' ? attributes.language : 'plaintext';
					const html = highlighter.highlight(attributes.content, lang);

					// Use `unescapeHTML` to return `HTMLString` for Astro renderer to inline as HTML
					return unescapeHTML(html) as any;
				},
			},
		},
	};
}
