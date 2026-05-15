import type { CodeAction, LanguageServiceContext } from '@volar/language-service';
export declare function enhancedProvideCodeActions(
	codeActions: CodeAction[],
	context: LanguageServiceContext,
): CodeAction[];
export declare function enhancedResolveCodeAction(
	codeAction: CodeAction,
	context: LanguageServiceContext,
): CodeAction;
