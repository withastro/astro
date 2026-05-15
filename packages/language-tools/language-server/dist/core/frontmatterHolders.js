'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.FrontmatterHolder =
	exports.frontmatterRE =
	exports.SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS =
	exports.SUPPORTED_FRONTMATTER_EXTENSIONS =
		void 0;
exports.getFrontmatterLanguagePlugin = getFrontmatterLanguagePlugin;
const yaml2ts_1 = require('@astrojs/yaml2ts');
const language_core_1 = require('@volar/language-core');
exports.SUPPORTED_FRONTMATTER_EXTENSIONS = { md: 'markdown', mdx: 'mdx', mdoc: 'markdoc' };
exports.SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS = Object.keys(
	exports.SUPPORTED_FRONTMATTER_EXTENSIONS,
);
const SUPPORTED_FRONTMATTER_EXTENSIONS_VALUES = Object.values(
	exports.SUPPORTED_FRONTMATTER_EXTENSIONS,
);
exports.frontmatterRE = /^---(.*?)^---/ms;
function getCollectionName(collectionConfig, fileURI) {
	for (const collection of collectionConfig.configs) {
		if (collection.config.entries[fileURI]) {
			return collection.config.entries[fileURI];
		}
	}
}
function getFrontmatterLanguagePlugin(collectionConfig) {
	return {
		getLanguageId(scriptId) {
			const fileType = exports.SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.find((ext) =>
				scriptId.path.endsWith(`.${ext}`),
			);
			if (fileType) {
				return exports.SUPPORTED_FRONTMATTER_EXTENSIONS[fileType];
			}
		},
		createVirtualCode(scriptId, languageId, snapshot) {
			if (SUPPORTED_FRONTMATTER_EXTENSIONS_VALUES.includes(languageId)) {
				return new FrontmatterHolder(
					scriptId.fsPath.replace(/\\/g, '/'),
					languageId,
					snapshot,
					getCollectionName(
						collectionConfig,
						// The scriptId here is encoded and somewhat normalized, as such we can't use it directly to compare with
						// the file URLs in the collection config entries that Astro generates.
						decodeURIComponent(scriptId.toString()).toLowerCase(),
					),
				);
			}
		},
		typescript: {
			extraFileExtensions: exports.SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.map((ext) => ({
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
		this.hasFrontmatter = false;
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
		if (!this.collection) {
			// If the file is not part of a collection, we don't need to do anything
			return;
		}
		const frontmatterContent =
			exports.frontmatterRE
				.exec(this.snapshot.getText(0, this.snapshot.getLength()))?.[0]
				.replaceAll('---', '   ') ?? '';
		this.hasFrontmatter = frontmatterContent.length > 0;
		this.embeddedCodes.push({
			id: `yaml_frontmatter_${this.collection}`,
			languageId: 'yaml',
			snapshot: {
				getText: (start, end) => frontmatterContent.substring(start, end),
				getLength: () => frontmatterContent.length,
				getChangeRange: () => undefined,
			},
			mappings: [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [frontmatterContent.length],
					data: {
						verification: true,
						completion: true,
						semantic: true,
						navigation: true,
						structure: true,
						format: false,
					},
				},
			],
		});
		if (this.hasFrontmatter) {
			const yaml2tsResult = (0, yaml2ts_1.yaml2ts)(frontmatterContent, this.collection);
			this.embeddedCodes.push(yaml2tsResult.virtualCode);
		}
	}
}
exports.FrontmatterHolder = FrontmatterHolder;
//# sourceMappingURL=frontmatterHolders.js.map
