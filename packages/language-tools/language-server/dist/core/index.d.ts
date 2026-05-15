import type { DiagnosticMessage } from '@astrojs/compiler/types';
import { type CodeMapping, type LanguagePlugin, type VirtualCode } from '@volar/language-core';
import type ts from 'typescript';
import type { HTMLDocument } from 'vscode-html-languageservice';
import type { URI } from 'vscode-uri';
import type { PackageInfo } from '../importPackage.js';
import type { AstroMetadata } from './parseAstro.js';
export declare function addAstroTypes(
	astroInstall: PackageInfo | undefined,
	ts: typeof import('typescript'),
	host: ts.LanguageServiceHost,
): void;
export declare function getAstroLanguagePlugin(): LanguagePlugin<URI, AstroVirtualCode>;
export declare class AstroVirtualCode implements VirtualCode {
	id: string;
	languageId: string;
	mappings: CodeMapping[];
	embeddedCodes: VirtualCode[];
	astroMeta: AstroMetadata;
	compilerDiagnostics: DiagnosticMessage[];
	htmlDocument: HTMLDocument;
	codegenStacks: never[];
	fileName: string;
	snapshot: ts.IScriptSnapshot;
	constructor(fileName: string, snapshot: ts.IScriptSnapshot);
	get hasCompilationErrors(): boolean;
}
