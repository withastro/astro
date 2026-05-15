'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.enhancedProvideCompletionItems = enhancedProvideCompletionItems;
exports.enhancedResolveCompletionItem = enhancedResolveCompletionItem;
const language_server_1 = require('@volar/language-server');
const vscode_uri_1 = require('vscode-uri');
const index_js_1 = require('../../core/index.js');
const utils_js_1 = require('./utils.js');
function enhancedProvideCompletionItems(ts, completions, documentText) {
	const importedAstroSources = (0, utils_js_1.getAlreadyImportedAstroComponentSources)(
		ts,
		documentText,
	);
	completions.items = completions.items
		.filter((completion) => {
			if (!isValidCompletion(completion)) {
				return false;
			}
			const source = completion?.data?.originalItem?.source;
			return !(source && importedAstroSources.has(source));
		})
		.map((completion) => {
			const source = completion?.data?.originalItem?.source;
			if (source) {
				// Sort completions starting with `astro:` higher than other imports
				if (source.startsWith('astro:')) {
					completion.sortText = '\u0000' + (completion.sortText ?? completion.label);
				}
				// For components import, use the file kind and sort them first, as they're often what the user want over something else
				if (['.astro', '.svelte', '.vue'].some((ext) => source.endsWith(ext))) {
					completion.kind = language_server_1.CompletionItemKind.File;
					completion.detail = completion.detail + '\n\n' + source;
					completion.sortText = '\u0001' + (completion.sortText ?? completion.label);
					completion.data.isComponent = true;
					if ((0, utils_js_1.isAstroComponentImportSource)(source)) {
						rewriteAstroComponentCompletion(completion);
					}
				}
			}
			return completion;
		});
	return completions;
}
function enhancedResolveCompletionItem(resolvedCompletion, context) {
	// Make sure we keep our icons even when the completion is resolved
	if (resolvedCompletion.data.isComponent) {
		resolvedCompletion.detail = getDetailForFileCompletion(
			resolvedCompletion.detail ?? '',
			resolvedCompletion.data.originalItem.source,
		);
	}
	if ((0, utils_js_1.isAstroComponentImportSource)(resolvedCompletion.data.originalItem.source)) {
		rewriteAstroComponentCompletion(resolvedCompletion);
	}
	if (resolvedCompletion.additionalTextEdits) {
		const decoded = context.decodeEmbeddedDocumentUri(
			vscode_uri_1.URI.parse(resolvedCompletion.data.uri),
		);
		const sourceScript = decoded && context.language.scripts.get(decoded[0]);
		const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
		const root = sourceScript?.generated?.root;
		if (!virtualCode || !(root instanceof index_js_1.AstroVirtualCode)) return resolvedCompletion;
		resolvedCompletion.additionalTextEdits = resolvedCompletion.additionalTextEdits.map((edit) =>
			(0, utils_js_1.mapEdit)(edit, root, virtualCode.languageId),
		);
	}
	return resolvedCompletion;
}
function rewriteAstroComponentCompletion(completion) {
	completion.label = (0, utils_js_1.stripAstroComponentSuffix)(String(completion.label));
	completion.filterText = completion.filterText
		? (0, utils_js_1.stripAstroComponentSuffix)(completion.filterText)
		: completion.filterText;
	completion.insertText = completion.insertText
		? (0, utils_js_1.stripAstroComponentSuffix)(completion.insertText)
		: completion.insertText;
	if (completion.textEdit && 'newText' in completion.textEdit) {
		completion.textEdit.newText = (0, utils_js_1.stripAstroComponentSuffix)(
			completion.textEdit.newText,
		);
	}
	if (completion.additionalTextEdits) {
		completion.additionalTextEdits = completion.additionalTextEdits.map((edit) => ({
			...edit,
			newText: (0, utils_js_1.rewriteAstroImportText)(edit.newText),
		}));
	}
}
function getDetailForFileCompletion(detail, source) {
	return `${detail}\n\n${source}`;
}
// When Svelte components are imported, we have to reference the svelte2tsx's types to properly type the component
// An unfortunate downside of this is that it pollutes completions, so let's filter those internal types manually
const svelte2tsxTypes = new Set([
	'Svelte2TsxComponent',
	'Svelte2TsxComponentConstructorParameters',
	'SvelteComponentConstructor',
	'SvelteActionReturnType',
	'SvelteTransitionConfig',
	'SvelteTransitionReturnType',
	'SvelteAnimationReturnType',
	'SvelteWithOptionalProps',
	'SvelteAllProps',
	'SveltePropsAnyFallback',
	'SvelteSlotsAnyFallback',
	'SvelteRestProps',
	'SvelteSlots',
	'SvelteStore',
]);
function isValidCompletion(completion) {
	const isSvelte2tsxCompletion =
		completion.label.startsWith('__sveltets_') || svelte2tsxTypes.has(completion.label);
	// Filter out completions for the children prop, as it doesn't work in Astro
	const isChildrenCompletion =
		completion.label === 'children?' &&
		completion.kind === language_server_1.CompletionItemKind.Field &&
		completion.filterText === 'children={$1}';
	if (isSvelte2tsxCompletion || isChildrenCompletion) return false;
	return true;
}
//# sourceMappingURL=completions.js.map
