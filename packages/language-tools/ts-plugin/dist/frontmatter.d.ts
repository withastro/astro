import { type CodeMapping, type LanguagePlugin, type VirtualCode } from '@volar/language-core';
import type ts from 'typescript';
export declare const frontmatterRE: RegExp;
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
export declare function getFrontmatterLanguagePlugin(
	collectionConfig: CollectionConfig[],
): LanguagePlugin<string, FrontmatterHolder>;
export declare class FrontmatterHolder implements VirtualCode {
	id: string;
	mappings: CodeMapping[];
	embeddedCodes: VirtualCode[];
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
