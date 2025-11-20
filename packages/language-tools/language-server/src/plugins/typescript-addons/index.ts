import type {
	CompletionList,
	LanguageServicePlugin,
	LanguageServicePluginInstance,
} from '@volar/language-server';
import { URI } from 'vscode-uri';
import { AstroVirtualCode } from '../../core/index.js';
import { isInsideFrontmatter, isJSDocument } from '../utils.js';
import { getSnippetCompletions } from './snippets.js';

export const create = (): LanguageServicePlugin => {
	return {
		capabilities: {
			completionProvider: {
				resolveProvider: true,
			},
		},
		create(context): LanguageServicePluginInstance {
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
						!isJSDocument ||
						token.isCancellationRequested ||
						completionContext.triggerKind === 2
					)
						return null;

					const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const root = sourceScript?.generated?.root;
					if (!(root instanceof AstroVirtualCode)) return undefined;

					if (!isInsideFrontmatter(document.offsetAt(position), root.astroMeta.frontmatter))
						return null;

					const completionList: CompletionList = {
						items: [],
						isIncomplete: false,
					};

					completionList.items.push(...getSnippetCompletions(root.astroMeta.frontmatter));

					return completionList;
				},
				resolveCompletionItem(item) {
					return item;
				},
			};
		},
	};
};
