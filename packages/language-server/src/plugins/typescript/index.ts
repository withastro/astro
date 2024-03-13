import type { ServicePlugin, ServicePluginInstance } from '@volar/language-server';
import { create as createTypeScriptServices } from 'volar-service-typescript';
import { AstroVirtualCode } from '../../core/index.js';
import { enhancedProvideCodeActions, enhancedResolveCodeAction } from './codeActions.js';
import { enhancedProvideCompletionItems, enhancedResolveCompletionItem } from './completions.js';
import { enhancedProvideSemanticDiagnostics } from './diagnostics.js';

export const create = (ts: typeof import('typescript')): ServicePlugin[] => {
	const tsServicePlugins = createTypeScriptServices(ts as typeof import('typescript'), {});
	return tsServicePlugins.map<ServicePlugin>(plugin => {
		if (plugin.name === 'typescript-semantic') {
			return {
				...plugin,
				create(context): ServicePluginInstance {
					const typeScriptPlugin = plugin.create(context);
					return {
						...typeScriptPlugin,
						async provideCompletionItems(document, position, completionContext, token) {
							const originalCompletions = await typeScriptPlugin.provideCompletionItems!(
								document,
								position,
								completionContext,
								token
							);
							if (!originalCompletions) return null;

							return enhancedProvideCompletionItems(originalCompletions);
						},
						async resolveCompletionItem(item, token) {
							const resolvedCompletionItem = await typeScriptPlugin.resolveCompletionItem!(item, token);
							if (!resolvedCompletionItem) return item;

							return enhancedResolveCompletionItem(resolvedCompletionItem, context);
						},
						async provideCodeActions(document, range, codeActionContext, token) {
							const originalCodeActions = await typeScriptPlugin.provideCodeActions!(
								document,
								range,
								codeActionContext,
								token
							);
							if (!originalCodeActions) return null;

							return enhancedProvideCodeActions(originalCodeActions, context);
						},
						async resolveCodeAction(codeAction, token) {
							const resolvedCodeAction = await typeScriptPlugin.resolveCodeAction!(codeAction, token);
							if (!resolvedCodeAction) return codeAction;

							return enhancedResolveCodeAction(resolvedCodeAction, context);
						},
						async provideSemanticDiagnostics(document, token) {
							const [_, source] = context.documents.getVirtualCodeByUri(document.uri);
							const code = source?.generated?.code;
							let tsxLineCount = undefined;

							if (code instanceof AstroVirtualCode) {
								// If we have compiler errors, our TSX isn't valid so don't bother showing TS errors
								if (code.hasCompilationErrors) return null;

								// We'll use this to filter out diagnostics that are outside the mapped range of the TSX
								tsxLineCount = code.astroMeta.tsxRanges.body.end.line;
							}

							const diagnostics = await typeScriptPlugin.provideSemanticDiagnostics!(document, token);
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
