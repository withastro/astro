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
				async transform({ attributes }) {
					// NOTE: The `meta` from fence code, e.g. ```js {1,3-4}, isn't quite supported by Markdoc.
					// Only the `js` part is parsed as `attributes.language` and the rest is ignored. This means
					// some Shiki transformers may not work correctly as it relies on the `meta`.
					const lang = typeof attributes.language === 'string' ? attributes.language : 'plaintext';
					const html = await highlighter.highlight(attributes.content, lang);

					// Use `unescapeHTML` to return `HTMLString` for Astro renderer to inline as HTML
					return unescapeHTML(html) as any;
				},
			},
		},
	};
}
