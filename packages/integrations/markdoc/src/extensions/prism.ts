// @ts-expect-error Cannot find module 'astro/runtime/server/index.js' or its corresponding type declarations.
import { unescapeHTML } from 'astro/runtime/server/index.js';
import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import { Markdoc, type AstroMarkdocConfig } from '../config.js';

export default async function prism(): Promise<AstroMarkdocConfig> {
	return {
		nodes: {
			fence: {
				attributes: Markdoc.nodes.fence.attributes!,
				transform({ attributes: { language, content } }) {
					const { html, classLanguage } = runHighlighterWithAstro(language, content);

					// Use `unescapeHTML` to return `HTMLString` for Astro renderer to inline as HTML
					return unescapeHTML(
						`<pre class="${classLanguage}"><code class="${classLanguage}">${html}</code></pre>`
					);
				},
			},
		},
	};
}
