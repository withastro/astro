import { type CodeMapping, type LanguagePlugin, type VirtualCode } from '@volar/language-core';
import type ts from 'typescript';
import type { URI } from 'vscode-uri';
export declare const SUPPORTED_FRONTMATTER_EXTENSIONS: {
	md: string;
	mdx: string;
	mdoc: string;
};
export declare const SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS: string[];
export declare const frontmatterRE: RegExp;
export type CollectionConfig = {
	reload: (
		folders: {
			uri: string;
		}[],
	) => void;
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
export declare function getFrontmatterLanguagePlugin(
	collectionConfig: CollectionConfig,
): LanguagePlugin<URI, FrontmatterHolder>;
export declare class FrontmatterHolder implements VirtualCode {
	id: string;
	mappings: CodeMapping[];
	embeddedCodes: VirtualCode[];
	hasFrontmatter: boolean;
	fileName: string;
	languageId: string;
	snapshot: ts.IScriptSnapshot;
	collection: string | undefined;
	constructor(
		fileName: string,
		languageId: string,
		snapshot: ts.IScriptSnapshot,
		collection: string | undefined,
	);
}
