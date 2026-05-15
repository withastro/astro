'use strict';
/// <reference types="@volar/typescript" />
Object.defineProperty(exports, '__esModule', { value: true });
exports.AstroVirtualCode = void 0;
exports.getLanguagePlugin = getLanguagePlugin;
const language_core_1 = require('@volar/language-core');
const astro2tsx_js_1 = require('./astro2tsx.js');
function getLanguagePlugin() {
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
				for (const code of (0, language_core_1.forEachEmbeddedCode)(astroCode)) {
					if (code.id === 'tsx') {
						return {
							code,
							extension: '.tsx',
							scriptKind: 4,
						};
					}
				}
			},
		},
	};
}
class AstroVirtualCode {
	constructor(fileName, snapshot) {
		this.id = 'root';
		this.languageId = 'astro';
		this.codegenStacks = [];
		this.fileName = fileName;
		this.snapshot = snapshot;
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
		const tsx = (0, astro2tsx_js_1.astro2tsx)(
			this.snapshot.getText(0, this.snapshot.getLength()),
			this.fileName,
		);
		this.embeddedCodes.push(tsx.virtualFile);
	}
}
exports.AstroVirtualCode = AstroVirtualCode;
