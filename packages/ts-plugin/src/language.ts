import type { LanguagePlugin, VirtualFile } from '@volar/language-core';
import type ts from 'typescript/lib/tsserverlibrary.js';
import { astro2tsx } from './astro2tsx.js';

export function getLanguageModule(
	ts: typeof import('typescript/lib/tsserverlibrary.js')
): LanguagePlugin<AstroFile> {
	return {
		createVirtualFile(fileName, languageId, snapshot) {
			if (languageId === 'astro') {
				return new AstroFile(fileName, snapshot, ts);
			}
		},
		updateVirtualFile(astroFile, snapshot) {
			astroFile.update(snapshot);
		},
	};
}

export class AstroFile implements VirtualFile {
	fileName: string;
	languageId = 'astro';
	mappings!: VirtualFile['mappings'];
	embeddedFiles!: VirtualFile['embeddedFiles'];
	codegenStacks = [];

	constructor(
		public sourceFileName: string,
		public snapshot: ts.IScriptSnapshot,
		private readonly ts: typeof import('typescript/lib/tsserverlibrary.js')
	) {
		this.fileName = sourceFileName;
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

		this.embeddedFiles = [];

		const tsx = astro2tsx(
			this.snapshot.getText(0, this.snapshot.getLength()),
			this.fileName,
			this.ts
		);

		this.embeddedFiles.push(tsx.virtualFile);
	}
}
