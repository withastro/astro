import type {
	CompletionItem,
	CompletionList,
	LanguageServiceContext,
} from '@volar/language-server';
export declare function enhancedProvideCompletionItems(
	ts: typeof import('typescript'),
	completions: CompletionList,
	documentText: string,
): CompletionList;
export declare function enhancedResolveCompletionItem(
	resolvedCompletion: CompletionItem,
	context: LanguageServiceContext,
): CompletionItem;
