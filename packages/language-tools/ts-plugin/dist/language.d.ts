import { type CodeMapping, type LanguagePlugin, type VirtualCode } from '@volar/language-core';
import type ts from 'typescript';
export declare function getLanguagePlugin(): LanguagePlugin<string, AstroVirtualCode>;
export declare class AstroVirtualCode implements VirtualCode {
	id: string;
	languageId: string;
	mappings: CodeMapping[];
	embeddedCodes: VirtualCode[];
	codegenStacks: never[];
	fileName: string;
	snapshot: ts.IScriptSnapshot;
	constructor(fileName: string, snapshot: ts.IScriptSnapshot);
}
