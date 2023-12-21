import {
	FileCapabilities,
	FileKind,
	FileRangeCapabilities,
	type Language,
	type VirtualFile,
} from '@volar/language-core';
import type ts from 'typescript/lib/tsserverlibrary.js';
import { astro2tsx } from './astro2tsx.js';

export function getLanguageModule(
	ts: typeof import('typescript/lib/tsserverlibrary.js')
): Language<AstroFile> {
	return {
		createVirtualFile(fileName, snapshot) {
			if (fileName.endsWith('.astro')) {
				return new AstroFile(fileName, snapshot, ts);
			}
		},
		updateVirtualFile(astroFile, snapshot) {
			astroFile.update(snapshot);
		},
	};
}

export class AstroFile implements VirtualFile {
	kind = FileKind.TextFile;
	capabilities = FileCapabilities.full;

	fileName: string;
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
				sourceRange: [0, this.snapshot.getLength()],
				generatedRange: [0, this.snapshot.getLength()],
				data: FileRangeCapabilities.full,
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
