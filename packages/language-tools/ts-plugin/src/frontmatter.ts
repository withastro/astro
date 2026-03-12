import { pathToFileURL } from 'node:url';
import { VIRTUAL_CODE_ID, yaml2ts } from '@astrojs/yaml2ts';
import {
	type CodeMapping,
	forEachEmbeddedCode,
	type LanguagePlugin,
	type VirtualCode,
} from '@volar/language-core';
import type ts from 'typescript';

const SUPPORTED_FRONTMATTER_EXTENSIONS = { md: 'markdown', mdx: 'mdx', mdoc: 'markdoc' };
const SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS = Object.keys(SUPPORTED_FRONTMATTER_EXTENSIONS);
const SUPPORTED_FRONTMATTER_EXTENSIONS_VALUES = Object.values(SUPPORTED_FRONTMATTER_EXTENSIONS);

export const frontmatterRE = /^---(.*?)^---/ms;

export type CollectionConfig = {
	folder: string;
	config: {
		collections: {
			hasSchema: boolean;
			name: string;
		}[];
		entries: Record<string, string>;
	};
};

function getCollectionName(collectionConfig: CollectionConfig[], fsPath: string) {
	for (const collection of collectionConfig) {
		if (collection.config.entries[fsPath]) {
			return collection.config.entries[fsPath];
		}
	}
}

export function getFrontmatterLanguagePlugin(
	collectionConfig: CollectionConfig[],
): LanguagePlugin<string, FrontmatterHolder> {
	return {
		getLanguageId(scriptId) {
			const fileType = SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.find((ext) =>
				scriptId.endsWith(`.${ext}`),
			);

			if (fileType) {
				return SUPPORTED_FRONTMATTER_EXTENSIONS[
					fileType as keyof typeof SUPPORTED_FRONTMATTER_EXTENSIONS
				];
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
					getCollectionName(collectionConfig, pathToFileURL(fileName).toString().toLowerCase()),
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

		if (!this.collection) return;

		const frontmatterContent = frontmatterRE.exec(
			this.snapshot.getText(0, this.snapshot.getLength()),
		)?.[0];

		if (!frontmatterContent) return;

		const yaml2tsResult = yaml2ts(frontmatterContent, this.collection);
		this.embeddedCodes.push(yaml2tsResult.virtualCode);
	}
}
