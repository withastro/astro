import { createShikiHighlighter } from '@astrojs/markdown-remark';
import Markdoc from '@markdoc/markdoc';
import type { ShikiConfig } from 'astro';
import { unescapeHTML } from 'astro/runtime/server/index.js';
import type { AstroMarkdocConfig } from '../config.js';

export default async function shiki(config?: ShikiConfig): Promise<AstroMarkdocConfig> {
	const highlighter = await createShikiHighlighter(config);

	return {
		nodes: {
			fence: {
				attributes: Markdoc.nodes.fence.attributes!,
				transform({ attributes }) {
					const lang = typeof attributes.language === 'string' ? attributes.language : 'plaintext';
					const html = highlighter.highlight(attributes.content, lang);

					// Use `unescapeHTML` to return `HTMLString` for Astro renderer to inline as HTML
					return unescapeHTML(html) as any;
				},
			},
		},
	};
}
