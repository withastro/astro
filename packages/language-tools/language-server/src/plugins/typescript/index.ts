import type { LanguageServicePlugin, LanguageServicePluginInstance } from '@volar/language-server';
import { create as createTypeScriptServices } from 'volar-service-typescript';
import { URI } from 'vscode-uri';
import { AstroVirtualCode } from '../../core/index.js';
import { enhancedProvideCodeActions, enhancedResolveCodeAction } from './codeActions.js';
import { enhancedProvideCompletionItems, enhancedResolveCompletionItem } from './completions.js';
import { enhancedProvideSemanticDiagnostics } from './diagnostics.js';

export const create = (
	ts: typeof import('typescript'),
	options?: {
		disableAutoImportCache: boolean | undefined;
	},
): LanguageServicePlugin[] => {
	const tsServicePlugins = createTypeScriptServices(ts as typeof import('typescript'), {
		disableAutoImportCache: options?.disableAutoImportCache,
	});

	return tsServicePlugins.map<LanguageServicePlugin>((plugin) => {
		if (plugin.name === 'typescript-semantic') {
			return {
				...plugin,
				create(context): LanguageServicePluginInstance {
					const typeScriptPlugin = plugin.create(context);
					return {
						...typeScriptPlugin,
						async provideFileRenameEdits(oldUri, newUri, token) {
							const astroConfig = await context.env.getConfiguration?.<{
								updateImportsOnFileMove: { enabled: boolean };
							}>('astro');

							// Check for `false` explicitly, as the default value is `true`, but it might not be set explicitly depending on the editor
							if (astroConfig?.updateImportsOnFileMove.enabled === false) {
								return null;
							}

							return typeScriptPlugin.provideFileRenameEdits!(oldUri, newUri, token);
						},
						async provideCompletionItems(document, position, completionContext, token) {
							const originalCompletions = await typeScriptPlugin.provideCompletionItems!(
								document,
								position,
								completionContext,
								token,
							);
							if (!originalCompletions) return null;

							return enhancedProvideCompletionItems(originalCompletions);
						},
						async resolveCompletionItem(item, token) {
							const resolvedCompletionItem = await typeScriptPlugin.resolveCompletionItem!(
								item,
								token,
							);
							if (!resolvedCompletionItem) return item;

							return enhancedResolveCompletionItem(resolvedCompletionItem, context);
						},
						async provideCodeActions(document, range, codeActionContext, token) {
							const originalCodeActions = await typeScriptPlugin.provideCodeActions!(
								document,
								range,
								codeActionContext,
								token,
							);
							if (!originalCodeActions) return null;

							return enhancedProvideCodeActions(originalCodeActions, context);
						},
						async resolveCodeAction(codeAction, token) {
							const resolvedCodeAction = await typeScriptPlugin.resolveCodeAction!(
								codeAction,
								token,
							);
							if (!resolvedCodeAction) return codeAction;

							return enhancedResolveCodeAction(resolvedCodeAction, context);
						},
						async provideDiagnostics(document, token) {
							const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
							const sourceScript = decoded && context.language.scripts.get(decoded[0]);
							const root = sourceScript?.generated?.root;

							let tsxLineCount = undefined;
							if (root instanceof AstroVirtualCode && decoded?.[1] === 'tsx') {
								// If we have compiler errors, our TSX isn't valid so don't bother showing TS errors
								if (root.hasCompilationErrors) return null;

								// We'll use this to filter out diagnostics that are outside the mapped range of the TSX
								tsxLineCount = root.astroMeta.tsxRanges.body.end.line;
							}

							const diagnostics = await typeScriptPlugin.provideDiagnostics!(document, token);
							if (!diagnostics) return null;

							return enhancedProvideSemanticDiagnostics(diagnostics, tsxLineCount);
						},
					};
				},
			};
		}
		return plugin;
	});
};
