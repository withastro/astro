import { VIRTUAL_CODE_ID, yaml2ts } from '@astrojs/yaml2ts';
import {
	type CodeMapping,
	forEachEmbeddedCode,
	type LanguagePlugin,
	type VirtualCode,
} from '@volar/language-core';
import type ts from 'typescript';
import type { URI } from 'vscode-uri';

export const SUPPORTED_FRONTMATTER_EXTENSIONS = { md: 'markdown', mdx: 'mdx', mdoc: 'markdoc' };
export const SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS = Object.keys(SUPPORTED_FRONTMATTER_EXTENSIONS);
const SUPPORTED_FRONTMATTER_EXTENSIONS_VALUES = Object.values(SUPPORTED_FRONTMATTER_EXTENSIONS);

export const frontmatterRE = /^---(.*?)^---/ms;

export type CollectionConfig = {
	reload: (folders: { uri: string }[]) => void;
	configs: {
		folder: URI;
		config: CollectionConfigInstance;
	}[];
};

export type CollectionConfigInstance = {
	collections: {
		hasSchema: boolean;
		name: string;
	}[];
	entries: Record<string, string>;
};

function getCollectionName(collectionConfig: CollectionConfig, fileURI: string) {
	for (const collection of collectionConfig.configs) {
		if (collection.config.entries[fileURI]) {
			return collection.config.entries[fileURI];
		}
	}
}

export function getFrontmatterLanguagePlugin(
	collectionConfig: CollectionConfig,
): LanguagePlugin<URI, FrontmatterHolder> {
	return {
		getLanguageId(scriptId) {
			const fileType = SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.find((ext) =>
				scriptId.path.endsWith(`.${ext}`),
			);

			if (fileType) {
				return SUPPORTED_FRONTMATTER_EXTENSIONS[
					fileType as keyof typeof SUPPORTED_FRONTMATTER_EXTENSIONS
				];
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
			extraFileExtensions: SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.map((ext) => ({
				extension: ext,
				isMixedContent: true,
				scriptKind: 7 satisfies ts.ScriptKind.Deferred,
			})),
			getServiceScript(astroCode) {
				for (const code of forEachEmbeddedCode(astroCode)) {
					if (code.id === VIRTUAL_CODE_ID) {
						return {
							code,
							extension: '.ts',
							scriptKind: 3 satisfies ts.ScriptKind.TS,
						};
					}
				}
				return undefined;
			},
		},
	};
}

export class FrontmatterHolder implements VirtualCode {
	id = 'frontmatter-holder';
	mappings: CodeMapping[];
	embeddedCodes: VirtualCode[];
	public hasFrontmatter = false;

	constructor(
		public fileName: string,
		public languageId: string,
		public snapshot: ts.IScriptSnapshot,
		public collection: string | undefined,
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
					format: true,
				},
			},
		];

		this.embeddedCodes = [];
		this.snapshot = snapshot;

		// If the file is not part of a collection, we don't need to do anything
		if (!this.collection) {
			return;
		}

		const frontmatterContent =
			frontmatterRE
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
			const yaml2tsResult = yaml2ts(frontmatterContent, this.collection);
			this.embeddedCodes.push(yaml2tsResult.virtualCode);
		}
	}
}
