import {
	type CodeInformation,
	forEachEmbeddedCode,
	type LanguagePlugin,
	type Mapping,
	type VirtualCode,
} from '@volar/language-core';
import type ts from 'typescript';
import type { URI } from 'vscode-uri';
import { framework2tsx } from './utils.js';

export function getSvelteLanguagePlugin(): LanguagePlugin<URI, SvelteVirtualCode> {
	return {
		getLanguageId(uri) {
			if (uri.path.endsWith('.svelte')) {
				return 'svelte';
			}
		},
		createVirtualCode(uri, languageId, snapshot) {
			if (languageId === 'svelte') {
				const fileName = uri.fsPath.replace(/\\/g, '/');
				return new SvelteVirtualCode(fileName, snapshot);
			}
		},
		typescript: {
			extraFileExtensions: [{ extension: 'svelte', isMixedContent: true, scriptKind: 7 }],
			getServiceScript(svelteCode) {
				for (const code of forEachEmbeddedCode(svelteCode)) {
					if (code.id === 'tsx') {
						return {
							code,
							extension: '.tsx',
							scriptKind: 4 satisfies ts.ScriptKind.TSX,
						};
					}
				}
			},
		},
	};
}

class SvelteVirtualCode implements VirtualCode {
	id = 'root';
	languageId = 'svelte';
	mappings!: Mapping<CodeInformation>[];
	embeddedCodes!: VirtualCode[];
	codegenStacks = [];

	constructor(
		public fileName: string,
		public snapshot: ts.IScriptSnapshot,
	) {
		this.mappings = [];

		this.embeddedCodes = [];
		this.embeddedCodes.push(
			framework2tsx(this.fileName, this.snapshot.getText(0, this.snapshot.getLength()), 'svelte'),
		);
	}
}
