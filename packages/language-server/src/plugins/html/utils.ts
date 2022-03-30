import { CompletionItem } from 'vscode-languageserver-types';

/**
 * The VS Code HTML language service provides a completion for data attributes that is independent from
 * data providers, which mean that you can't disable it, so this function removes them from a completionList
 */
export function removeDataAttrCompletion(items: CompletionItem[]) {
	return items.filter((item) => !item.label.startsWith('data-'));
}
