import { createShikiHighlighter } from '@astrojs/markdown-remark';
import Markdoc from '@markdoc/markdoc';
import { unescapeHTML } from 'astro/runtime/server/index.js';
async function shiki(config) {
	const highlighter = await createShikiHighlighter({
		langs: config?.langs,
		theme: config?.theme,
		themes: config?.themes,
	});
	return {
		nodes: {
			fence: {
				attributes: Markdoc.nodes.fence.attributes,
				async transform({ attributes }) {
					const lang = typeof attributes.language === 'string' ? attributes.language : 'plaintext';
					const html = await highlighter.codeToHtml(attributes.content, lang, {
						wrap: config?.wrap,
						defaultColor: config?.defaultColor,
						transformers: config?.transformers,
					});
					return unescapeHTML(html);
				},
			},
		},
	};
}
export { shiki as default };
