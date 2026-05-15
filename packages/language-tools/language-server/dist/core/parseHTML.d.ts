import type { VirtualCode } from '@volar/language-core';
import type ts from 'typescript';
import * as html from 'vscode-html-languageservice';
export declare function parseHTML(
	snapshot: ts.IScriptSnapshot,
	frontmatterEnd: number,
): {
	virtualCode: VirtualCode;
	htmlDocument: html.HTMLDocument;
};
/**
 * scan the text and remove any `>` or `<` that cause the tag to end short
 */
export declare function preprocessHTML(text: string, frontmatterEnd?: number): string;
