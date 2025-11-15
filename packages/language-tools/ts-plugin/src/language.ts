/// <reference types="@volar/typescript" />

import {
	type CodeMapping,
	forEachEmbeddedCode,
	type LanguagePlugin,
	type VirtualCode,
} from '@volar/language-core';
import type ts from 'typescript';
import { astro2tsx } from './astro2tsx.js';

export function getLanguagePlugin(): LanguagePlugin<string, AstroVirtualCode> {
	return {
		getLanguageId(fileName) {
			if (fileName.endsWith('.astro')) {
				return 'astro';
			}
		},
		createVirtualCode(fileName, languageId, snapshot) {
			if (languageId === 'astro') {
				return new AstroVirtualCode(fileName, snapshot);
			}
		},
		typescript: {
			extraFileExtensions: [{ extension: 'astro', isMixedContent: true, scriptKind: 7 }],
			getServiceScript(astroCode) {
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
		public snapshot: ts.IScriptSnapshot,
	) {
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
