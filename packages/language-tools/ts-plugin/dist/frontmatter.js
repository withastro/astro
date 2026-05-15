'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.FrontmatterHolder = exports.frontmatterRE = void 0;
exports.getFrontmatterLanguagePlugin = getFrontmatterLanguagePlugin;
const node_url_1 = require('node:url');
const yaml2ts_1 = require('@astrojs/yaml2ts');
const language_core_1 = require('@volar/language-core');
const SUPPORTED_FRONTMATTER_EXTENSIONS = { md: 'markdown', mdx: 'mdx', mdoc: 'markdoc' };
const SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS = Object.keys(SUPPORTED_FRONTMATTER_EXTENSIONS);
const SUPPORTED_FRONTMATTER_EXTENSIONS_VALUES = Object.values(SUPPORTED_FRONTMATTER_EXTENSIONS);
exports.frontmatterRE = /^---(.*?)^---/ms;
function getCollectionName(collectionConfig, fsPath) {
	for (const collection of collectionConfig) {
		if (collection.config.entries[fsPath]) {
			return collection.config.entries[fsPath];
		}
	}
}
function getFrontmatterLanguagePlugin(collectionConfig) {
	return {
		getLanguageId(scriptId) {
			const fileType = SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.find((ext) =>
				scriptId.endsWith(`.${ext}`),
			);
			if (fileType) {
				return SUPPORTED_FRONTMATTER_EXTENSIONS[fileType];
			}
		},
		createVirtualCode(scriptId, languageId, snapshot) {
			if (SUPPORTED_FRONTMATTER_EXTENSIONS_VALUES.includes(languageId)) {
				const fileName = scriptId.replace(/\\/g, '/');
				return new FrontmatterHolder(
					fileName,
					languageId,
					snapshot,
					// In TypeScript plugins, unlike in the language server, the scriptId is just a string file path
					// so we'll have to convert it to a URL to match the collection config entries
					getCollectionName(
						collectionConfig,
						(0, node_url_1.pathToFileURL)(fileName).toString().toLowerCase(),
					),
				);
			}
		},
		typescript: {
			extraFileExtensions: SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.map((ext) => ({
				extension: ext,
				isMixedContent: true,
				scriptKind: 7,
			})),
			getServiceScript(astroCode) {
				for (const code of (0, language_core_1.forEachEmbeddedCode)(astroCode)) {
					if (code.id === yaml2ts_1.VIRTUAL_CODE_ID) {
						return {
							code,
							extension: '.ts',
							scriptKind: 3,
						};
					}
				}
				return undefined;
			},
		},
	};
}
class FrontmatterHolder {
	constructor(fileName, languageId, snapshot, collection) {
		this.id = 'frontmatter-holder';
		this.fileName = fileName;
		this.languageId = languageId;
		this.snapshot = snapshot;
		this.collection = collection;
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
		this.snapshot = snapshot;
		if (!this.collection) return;
		const frontmatterContent = exports.frontmatterRE.exec(
			this.snapshot.getText(0, this.snapshot.getLength()),
		)?.[0];
		if (!frontmatterContent) return;
		const yaml2tsResult = (0, yaml2ts_1.yaml2ts)(frontmatterContent, this.collection);
		this.embeddedCodes.push(yaml2tsResult.virtualCode);
	}
}
exports.FrontmatterHolder = FrontmatterHolder;
