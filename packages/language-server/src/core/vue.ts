import type { CodeInformation, LanguagePlugin, Mapping, VirtualFile } from '@volar/language-core';
import type ts from 'typescript/lib/tsserverlibrary';
import { framework2tsx } from './utils.js';

export function getVueLanguageModule(): LanguagePlugin<VueFile> {
	return {
		createVirtualFile(fileName, languageId, snapshot) {
			if (languageId === 'vue') {
				return new VueFile(fileName, snapshot);
			}
		},
		updateVirtualFile(vueFile, snapshot) {
			vueFile.update(snapshot);
		},
	};
}

class VueFile implements VirtualFile {
	fileName: string;
	languageId = 'vue';
	mappings!: Mapping<CodeInformation>[];
	embeddedFiles!: VirtualFile[];
	codegenStacks = [];

	constructor(
		public sourceFileName: string,
		public snapshot: ts.IScriptSnapshot
	) {
		this.fileName = sourceFileName;
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

		this.embeddedFiles = [];
		this.embeddedFiles.push(
			framework2tsx(
				this.fileName,
				this.fileName,
				this.snapshot.getText(0, this.snapshot.getLength()),
				'vue'
			)
		);
	}
}
