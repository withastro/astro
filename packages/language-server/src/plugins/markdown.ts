import type { LanguageServicePlugin, LanguageServicePluginInstance } from '@volar/language-server';
import { isFrontmatterHolderDocument } from './utils.js';

export const create = (): LanguageServicePlugin => {
	return {
		capabilities: {
			diagnosticProvider: {
				workspaceDiagnostics: true,
			},
		},
		create(context): LanguageServicePluginInstance {
			return {
				provideDiagnostics(document, token) {
					if (!isFrontmatterHolderDocument(document.languageId)) return;

					return [];
				},
			};
		},
	};
};
