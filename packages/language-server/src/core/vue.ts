import {
	forEachEmbeddedCode,
	type CodeInformation,
	type LanguagePlugin,
	type Mapping,
	type VirtualCode,
} from '@volar/language-core';
import type ts from 'typescript';
import { framework2tsx } from './utils.js';

export function getVueLanguageModule(): LanguagePlugin<VueVirtualCode> {
	return {
		createVirtualCode(fileId, languageId, snapshot) {
			if (languageId === 'vue') {
				const fileName = fileId.includes('://') ? fileId.split('://')[1] : fileId;
				return new VueVirtualCode(fileName, snapshot);
			}
		},
		updateVirtualCode(_fileId, vueCode, snapshot) {
			vueCode.update(snapshot);
			return vueCode;
		},
		typescript: {
			extraFileExtensions: [{ extension: 'vue', isMixedContent: true, scriptKind: 7 }],
			getScript(vueCode) {
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
		public snapshot: ts.IScriptSnapshot
	) {
		this.onSnapshotUpdated();
	}

	public update(newSnapshot: ts.IScriptSnapshot) {
		this.snapshot = newSnapshot;
		this.onSnapshotUpdated();
	}

	private onSnapshotUpdated() {
		this.mappings = [
			{
				sourceOffsets: [0],
				generatedOffsets: [0],
				lengths: [this.snapshot.getLength()],
				data: {
					verification: true,
					completion: true,
					semantic: true,
					navigation: true,
					structure: true,
					format: true,
				},
			},
		];

		this.embeddedCodes = [];
		this.embeddedCodes.push(
			framework2tsx(this.fileName, this.snapshot.getText(0, this.snapshot.getLength()), 'vue')
		);
	}
}
