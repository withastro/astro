import type { Service } from '@volar/language-service';
import createTypeScriptService from 'volar-service-typescript';
import { AstroFile } from '../../core/index.js';
import { enhancedProvideCodeActions } from './codeActions.js';
import { enhancedProvideCompletionItems, enhancedResolveCompletionItem } from './completions.js';
import { enhancedProvideSemanticDiagnostics } from './diagnostics.js';

export default (): Service =>
	(context, modules): ReturnType<Service> => {
		const typeScriptPlugin = createTypeScriptService()(context, modules);

		if (!context) {
			return {
				triggerCharacters: typeScriptPlugin.triggerCharacters,
				signatureHelpTriggerCharacters: typeScriptPlugin.signatureHelpTriggerCharacters,
				signatureHelpRetriggerCharacters: typeScriptPlugin.signatureHelpRetriggerCharacters,
			};
		}

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

				return enhancedResolveCompletionItem(resolvedCompletionItem, item, context);
			},
			async provideCodeActions(document, range, codeActionContext, token) {
				const codeActions = await typeScriptPlugin.provideCodeActions!(
					document,
					range,
					codeActionContext,
					token
				);
				if (!codeActions) return null;

				const [_, source] = context.documents.getVirtualFileByUri(document.uri);
				const file = source?.root;
				if (!(file instanceof AstroFile) || !context.host) return codeActions;

				const newLine = context.host.getCompilationSettings().newLine?.toString() ?? '\n';
				return enhancedProvideCodeActions(
					codeActions,
					file,
					context.documents.getDocumentByFileName(file.snapshot, file.sourceFileName),
					document,
					newLine
				);
			},
			async provideSemanticDiagnostics(document, token) {
				const [_, source] = context.documents.getVirtualFileByUri(document.uri);
				const file = source?.root;
				if (!(file instanceof AstroFile)) return null;

				// If we have compiler errors, our TSX isn't valid so don't bother showing TS errors
				if (file.hasCompilationErrors) return null;

				const diagnostics = await typeScriptPlugin.provideSemanticDiagnostics!(document, token);
				if (!diagnostics) return null;

				const astroDocument = context.documents.getDocumentByFileName(
					file.snapshot,
					file.sourceFileName
				);

				return enhancedProvideSemanticDiagnostics(diagnostics, astroDocument.lineCount);
			},
		};
	};
