import type { LanguageServicePlugin, LanguageServicePluginInstance } from '@volar/language-server';
import { CompletionItemKind } from '@volar/language-server';
import { create as createHtmlService } from 'volar-service-html';
import * as html from 'vscode-html-languageservice';
import { URI, Utils } from 'vscode-uri';
import { AstroVirtualCode } from '../core/index.js';
import { astroAttributes, astroElements, classListAttribute } from './html-data.js';
import { isInComponentStartTag } from './utils.js';

export const create = (): LanguageServicePlugin => {
	const htmlPlugin = createHtmlService({
		getCustomData: async (context) => {
			const customData: string[] = (await context.env.getConfiguration?.('html.customData')) ?? [];
			const newData: html.IHTMLDataProvider[] = [];
			for (const customDataPath of customData) {
				for (const workspaceFolder of context.env.workspaceFolders) {
					const uri = Utils.resolvePath(workspaceFolder, customDataPath);
					const json = await context.env.fs?.readFile?.(uri);
					if (json) {
						try {
							const data = JSON.parse(json);
							newData.push(html.newHTMLDataProvider(customDataPath, data));
						} catch (error) {
							console.error(error);
						}
						break;
					}
				}
			}
			return [...newData, astroAttributes, astroElements, classListAttribute];
		},
	});
	return {
		...htmlPlugin,
		create(context): LanguageServicePluginInstance {
			const htmlPluginInstance = htmlPlugin.create(context);

			return {
				...htmlPluginInstance,
				async provideCompletionItems(document, position, completionContext, token) {
					if (document.languageId !== 'html') return;

					const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const root = sourceScript?.generated?.root;
					if (!(root instanceof AstroVirtualCode)) return;

					// Don't return completions if the current node is a component
					if (isInComponentStartTag(root.htmlDocument, document.offsetAt(position))) {
						return null;
					}

					const completions = await htmlPluginInstance.provideCompletionItems!(
						document,
						position,
						completionContext,
						token,
					);

					if (!completions) {
						return null;
					}

					// We don't want completions for file references, as they're mostly invalid for Astro
					completions.items = completions.items.filter(
						(completion) => completion.kind !== CompletionItemKind.File,
					);

					return completions;
				},
				// Document links provided by `vscode-html-languageservice` are invalid for Astro
				provideDocumentLinks() {
					return [];
				},
			};
		},
	};
};
