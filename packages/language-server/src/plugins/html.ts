import { CompletionItemKind, Service } from '@volar/language-server';
import createHtmlService from 'volar-service-html';
import { AstroFile } from '../core/index.js';
import { astroAttributes, astroElements, classListAttribute } from './html-data.js';
import { isInComponentStartTag } from './utils.js';

export const create =
	(): Service =>
	(context, modules): ReturnType<Service> => {
		const htmlPlugin = createHtmlService()(context, modules);

		if (!context) {
			return { triggerCharacters: htmlPlugin.triggerCharacters };
		}

		htmlPlugin.provide['html/updateCustomData']?.([
			astroAttributes,
			astroElements,
			classListAttribute,
		]);

		return {
			...htmlPlugin,
			async provideCompletionItems(document, position, completionContext, token) {
				if (document.languageId !== 'html') return;

				const [_, source] = context.documents.getVirtualFileByUri(document.uri);
				const rootVirtualFile = source?.root;
				if (!(rootVirtualFile instanceof AstroFile)) return;

				// Don't return completions if the current node is a component
				if (isInComponentStartTag(rootVirtualFile.htmlDocument, document.offsetAt(position))) {
					return null;
				}

				const completions = await htmlPlugin.provideCompletionItems!(
					document,
					position,
					completionContext,
					token
				);

				if (!completions) {
					return null;
				}

				// We don't want completions for file references, as they're mostly invalid for Astro
				completions.items = completions.items.filter(
					(completion) => completion.kind !== CompletionItemKind.File
				);

				return completions;
			},
			// Document links provided by `vscode-html-languageservice` are invalid for Astro
			provideDocumentLinks() {
				return [];
			},
		};
	};
