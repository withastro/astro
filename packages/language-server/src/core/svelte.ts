import {
	type CodeInformation,
	type LanguagePlugin,
	type Mapping,
	type VirtualCode,
	forEachEmbeddedCode,
} from '@volar/language-core';
import type ts from 'typescript';
import { URI } from 'vscode-uri';
import { framework2tsx } from './utils.js';

export function getSvelteLanguageModule(): LanguagePlugin<SvelteVirtualCode> {
	return {
		getLanguageId(scriptId) {
			if (scriptId.endsWith('.svelte')) {
				return 'svelte';
			}
		},
		createVirtualCode(scriptId, languageId, snapshot) {
			if (languageId === 'svelte') {
				const fileName = scriptId.includes('://')
					? URI.parse(scriptId).fsPath.replace(/\\/g, '/')
					: scriptId;
				return new SvelteVirtualCode(fileName, snapshot);
			}
		},
		updateVirtualCode(_scriptId, svelteCode, snapshot) {
			svelteCode.update(snapshot);
			return svelteCode;
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
		public snapshot: ts.IScriptSnapshot
	) {
		this.onSnapshotUpdated();
	}

	public update(newSnapshot: ts.IScriptSnapshot) {
		this.snapshot = newSnapshot;
		this.onSnapshotUpdated();
	}

	private onSnapshotUpdated() {
		this.mappings = [];

		this.embeddedCodes = [];
		this.embeddedCodes.push(
			framework2tsx(this.fileName, this.snapshot.getText(0, this.snapshot.getLength()), 'svelte')
		);
	}
}
