import {
	type CodeMapping,
	type LanguagePlugin,
	type VirtualCode,
	forEachEmbeddedCode,
} from '@volar/language-core';
import type ts from 'typescript';
import { astro2tsx } from './astro2tsx.js';

export function getLanguageModule(): LanguagePlugin<AstroVirtualCode> {
	return {
		createVirtualCode(fileId, languageId, snapshot) {
			if (languageId === 'astro') {
				// fileId will never be a uri in ts plugin
				const fileName = fileId;
				return new AstroVirtualCode(fileName, snapshot);
			}
		},
		updateVirtualCode(_fileId, astroFile, snapshot) {
			astroFile.update(snapshot);
			return astroFile;
		},
		typescript: {
			extraFileExtensions: [{ extension: 'astro', isMixedContent: true, scriptKind: 7 }],
			getScript(astroCode) {
				for (const code of forEachEmbeddedCode(astroCode)) {
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

export class AstroVirtualCode implements VirtualCode {
	id = 'root';
	languageId = 'astro';
	mappings!: CodeMapping[];
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

	onSnapshotUpdated() {
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
					format: false,
				},
			},
		];

		this.embeddedCodes = [];

		const tsx = astro2tsx(this.snapshot.getText(0, this.snapshot.getLength()), this.fileName);

		this.embeddedCodes.push(tsx.virtualFile);
	}
}
