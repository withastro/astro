'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.create = void 0;
const vscode_uri_1 = require('vscode-uri');
const index_js_1 = require('../../core/index.js');
const utils_js_1 = require('../utils.js');
const snippets_js_1 = require('./snippets.js');
const create = () => {
	return {
		capabilities: {
			completionProvider: {
				resolveProvider: true,
			},
		},
		create(context) {
			return {
				isAdditionalCompletion: true,
				// Q: Why the empty transform and resolve functions?
				// A: Volar will skip mapping the completion items if those functions are defined, as such we can return the snippets
				// completions as-is, this is notably useful for snippets that insert to the frontmatter, since we don't need to map anything.
				transformCompletionItem(item) {
					return item;
				},
				provideCompletionItems(document, position, completionContext, token) {
					if (
						!context ||
						!utils_js_1.isJSDocument ||
						token.isCancellationRequested ||
						completionContext.triggerKind === 2
					)
						return null;
					const decoded = context.decodeEmbeddedDocumentUri(vscode_uri_1.URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const root = sourceScript?.generated?.root;
					if (!(root instanceof index_js_1.AstroVirtualCode)) return undefined;
					if (
						!(0, utils_js_1.isInsideFrontmatter)(
							document.offsetAt(position),
							root.astroMeta.frontmatter,
						)
					)
						return null;
					const completionList = {
						items: [],
						isIncomplete: false,
					};
					completionList.items.push(
						...(0, snippets_js_1.getSnippetCompletions)(root.astroMeta.frontmatter),
					);
					return completionList;
				},
				resolveCompletionItem(item) {
					return item;
				},
			};
		},
	};
};
exports.create = create;
//# sourceMappingURL=index.js.map
