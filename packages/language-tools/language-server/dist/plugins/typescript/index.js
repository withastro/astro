'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.create = void 0;
const volar_service_typescript_1 = require('volar-service-typescript');
const vscode_uri_1 = require('vscode-uri');
const index_js_1 = require('../../core/index.js');
const codeActions_js_1 = require('./codeActions.js');
const completions_js_1 = require('./completions.js');
const diagnostics_js_1 = require('./diagnostics.js');
const create = (ts, options) => {
	const tsServicePlugins = (0, volar_service_typescript_1.create)(ts, {
		disableAutoImportCache: options?.disableAutoImportCache,
	});
	return tsServicePlugins.map((plugin) => {
		if (plugin.name === 'typescript-semantic') {
			return {
				...plugin,
				create(context) {
					const typeScriptPlugin = plugin.create(context);
					return {
						...typeScriptPlugin,
						async provideFileRenameEdits(oldUri, newUri, token) {
							const astroConfig = await context.env.getConfiguration?.('astro');
							// Check for `false` explicitly, as the default value is `true`, but it might not be set explicitly depending on the editor
							if (astroConfig?.updateImportsOnFileMove.enabled === false) {
								return null;
							}
							return typeScriptPlugin.provideFileRenameEdits(oldUri, newUri, token);
						},
						async provideCompletionItems(document, position, completionContext, token) {
							const originalCompletions = await typeScriptPlugin.provideCompletionItems(
								document,
								position,
								completionContext,
								token,
							);
							if (!originalCompletions) return null;
							return (0, completions_js_1.enhancedProvideCompletionItems)(
								ts,
								originalCompletions,
								document.getText(),
							);
						},
						async resolveCompletionItem(item, token) {
							const resolvedCompletionItem = await typeScriptPlugin.resolveCompletionItem(
								item,
								token,
							);
							if (!resolvedCompletionItem) return item;
							return (0, completions_js_1.enhancedResolveCompletionItem)(
								resolvedCompletionItem,
								context,
							);
						},
						async provideCodeActions(document, range, codeActionContext, token) {
							const originalCodeActions = await typeScriptPlugin.provideCodeActions(
								document,
								range,
								codeActionContext,
								token,
							);
							if (!originalCodeActions) return null;
							return (0, codeActions_js_1.enhancedProvideCodeActions)(originalCodeActions, context);
						},
						async resolveCodeAction(codeAction, token) {
							const resolvedCodeAction = await typeScriptPlugin.resolveCodeAction(
								codeAction,
								token,
							);
							if (!resolvedCodeAction) return codeAction;
							return (0, codeActions_js_1.enhancedResolveCodeAction)(resolvedCodeAction, context);
						},
						async provideDiagnostics(document, token) {
							const decoded = context.decodeEmbeddedDocumentUri(
								vscode_uri_1.URI.parse(document.uri),
							);
							const sourceScript = decoded && context.language.scripts.get(decoded[0]);
							const root = sourceScript?.generated?.root;
							let tsxLineCount = undefined;
							if (root instanceof index_js_1.AstroVirtualCode && decoded?.[1] === 'tsx') {
								// If we have compiler errors, our TSX isn't valid so don't bother showing TS errors
								if (root.hasCompilationErrors) return null;
								// We'll use this to filter out diagnostics that are outside the mapped range of the TSX
								tsxLineCount = root.astroMeta.tsxRanges.body.end.line;
							}
							const diagnostics = await typeScriptPlugin.provideDiagnostics(document, token);
							if (!diagnostics) return null;
							return (0, diagnostics_js_1.enhancedProvideSemanticDiagnostics)(
								diagnostics,
								tsxLineCount,
							);
						},
					};
				},
			};
		}
		return plugin;
	});
};
exports.create = create;
//# sourceMappingURL=index.js.map
