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

export function getVueLanguagePlugin(): LanguagePlugin<URI, VueVirtualCode> {
	return {
		getLanguageId(uri) {
			if (uri.path.endsWith('.vue')) {
				return 'vue';
			}
		},
		createVirtualCode(uri, languageId, snapshot) {
			if (languageId === 'vue') {
				const fileName = uri.fsPath.replace(/\\/g, '/');
				return new VueVirtualCode(fileName, snapshot);
			}
		},
		typescript: {
			extraFileExtensions: [{ extension: 'vue', isMixedContent: true, scriptKind: 7 }],
			getServiceScript(vueCode) {
				for (const code of forEachEmbeddedCode(vueCode)) {
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

class VueVirtualCode implements VirtualCode {
	id = 'root';
	languageId = 'vue';
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
			framework2tsx(this.fileName, this.snapshot.getText(0, this.snapshot.getLength()), 'vue'),
		);
	}
}
