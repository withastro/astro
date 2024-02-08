import {
	forEachEmbeddedCode,
	type CodeInformation,
	type LanguagePlugin,
	type Mapping,
	type VirtualCode,
} from '@volar/language-core';
import type ts from 'typescript';
import { framework2tsx } from './utils.js';

export function getSvelteLanguageModule(): LanguagePlugin<SvelteVirtualCode> {
	return {
		createVirtualCode(fileId, languageId, snapshot) {
			if (languageId === 'svelte') {
				const fileName = fileId.includes('://') ? fileId.split('://')[1] : fileId;
				return new SvelteVirtualCode(fileName, snapshot);
			}
		},
		updateVirtualCode(_fileId, svelteCode, snapshot) {
			svelteCode.update(snapshot);
			return svelteCode;
		},
		typescript: {
			extraFileExtensions: [{ extension: 'svelte', isMixedContent: true, scriptKind: 7 }],
			getScript(svelteCode) {
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
			framework2tsx(this.fileName, this.snapshot.getText(0, this.snapshot.getLength()), 'svelte')
		);
	}
}
