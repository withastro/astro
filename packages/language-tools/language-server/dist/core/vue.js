'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getVueLanguagePlugin = getVueLanguagePlugin;
const language_core_1 = require('@volar/language-core');
const utils_js_1 = require('./utils.js');
function getVueLanguagePlugin() {
	return {
		getLanguageId(uri) {
			if (uri.path.endsWith('.vue')) {
				return 'vue';
			}
		},
		createVirtualCode(uri, languageId, snapshot) {
			if (languageId === 'vue') {
				const fileName = uri.fsPath.replace(/\\/g, '/');
				return new VueVirtualCode(fileName, snapshot);
			}
		},
		typescript: {
			extraFileExtensions: [{ extension: 'vue', isMixedContent: true, scriptKind: 7 }],
			getServiceScript(vueCode) {
				for (const code of (0, language_core_1.forEachEmbeddedCode)(vueCode)) {
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
class VueVirtualCode {
	constructor(fileName, snapshot) {
		this.id = 'root';
		this.languageId = 'vue';
		this.codegenStacks = [];
		this.fileName = fileName;
		this.snapshot = snapshot;
		this.mappings = [];
		this.embeddedCodes = [];
		this.embeddedCodes.push(
			(0, utils_js_1.framework2tsx)(
				this.fileName,
				this.snapshot.getText(0, this.snapshot.getLength()),
				'vue',
			),
		);
	}
}
//# sourceMappingURL=vue.js.map
