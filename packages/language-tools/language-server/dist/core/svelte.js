'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getSvelteLanguagePlugin = getSvelteLanguagePlugin;
const language_core_1 = require('@volar/language-core');
const utils_js_1 = require('./utils.js');
function getSvelteLanguagePlugin() {
	return {
		getLanguageId(uri) {
			if (uri.path.endsWith('.svelte')) {
				return 'svelte';
			}
		},
		createVirtualCode(uri, languageId, snapshot) {
			if (languageId === 'svelte') {
				const fileName = uri.fsPath.replace(/\\/g, '/');
				return new SvelteVirtualCode(fileName, snapshot);
			}
		},
		typescript: {
			extraFileExtensions: [{ extension: 'svelte', isMixedContent: true, scriptKind: 7 }],
			getServiceScript(svelteCode) {
				for (const code of (0, language_core_1.forEachEmbeddedCode)(svelteCode)) {
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
class SvelteVirtualCode {
	constructor(fileName, snapshot) {
		this.id = 'root';
		this.languageId = 'svelte';
		this.codegenStacks = [];
		this.fileName = fileName;
		this.snapshot = snapshot;
		this.mappings = [];
		this.embeddedCodes = [];
		this.embeddedCodes.push(
			(0, utils_js_1.framework2tsx)(
				this.fileName,
				this.snapshot.getText(0, this.snapshot.getLength()),
				'svelte',
			),
		);
	}
}
//# sourceMappingURL=svelte.js.map
