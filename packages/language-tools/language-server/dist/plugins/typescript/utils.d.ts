import type { TextEdit } from 'vscode-html-languageservice';
import type { AstroVirtualCode } from '../../core/index.js';
export declare function isAstroComponentImportSource(source: string | undefined): source is string;
export declare function stripAstroComponentSuffix(name: string): string;
export declare function rewriteAstroImportText(text: string): string;
export declare function getAlreadyImportedAstroComponentSources(
	ts: typeof import('typescript'),
	documentText: string,
): Set<string>;
export declare function mapEdit(
	edit: TextEdit,
	code: AstroVirtualCode,
	languageId: string,
): TextEdit;
