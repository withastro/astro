import type { VirtualCode } from '@volar/language-core';
import type ts from 'typescript';
import * as html from 'vscode-html-languageservice';
import { isInsideExpression } from '../plugins/utils';

const htmlLs = html.getLanguageService();

export function parseHTML(
	snapshot: ts.IScriptSnapshot,
	frontmatterEnd: number,
): { virtualCode: VirtualCode; htmlDocument: html.HTMLDocument } {
	const htmlContent = preprocessHTML(snapshot.getText(0, snapshot.getLength()), frontmatterEnd);

	return {
		virtualCode: getHTMLVirtualCode(htmlContent),
		htmlDocument: getHTMLDocument(htmlContent),
	};
}

const createScanner = htmlLs.createScanner as (
	input: string,
	initialOffset?: number,
	initialState?: html.ScannerState,
) => html.Scanner;

/**
 * scan the text and remove any `>` or `<` that cause the tag to end short
 */
export function preprocessHTML(text: string, frontmatterEnd?: number) {
	let content = text.split('').fill(' ', 0, frontmatterEnd).join('');

	let scanner = createScanner(content);
	let token = scanner.scan();
	let currentStartTagStart: number | null = null;

	while (token !== html.TokenType.EOS) {
		const offset = scanner.getTokenOffset();

		if (token === html.TokenType.StartTagOpen) {
			currentStartTagStart = offset;
		}

		if (token === html.TokenType.StartTagClose) {
			if (shouldBlankStartOrEndTagLike(offset)) {
				blankStartOrEndTagLike(offset);
			} else {
				currentStartTagStart = null;
			}
		}

		if (token === html.TokenType.StartTagSelfClose) {
			currentStartTagStart = null;
		}

		// <Foo checked={a < 1}>
		// https://github.com/microsoft/vscode-html-languageservice/blob/71806ef57be07e1068ee40900ef8b0899c80e68a/src/parser/htmlScanner.ts#L327
		if (
			token === html.TokenType.Unknown &&
			scanner.getScannerState() === html.ScannerState.WithinTag &&
			scanner.getTokenText() === '<' &&
			shouldBlankStartOrEndTagLike(offset)
		) {
			blankStartOrEndTagLike(offset);
		}

		// TODO: Handle TypeScript generics inside expressions / Use the compiler to parse HTML instead?

		token = scanner.scan();
	}

	return content;

	function shouldBlankStartOrEndTagLike(offset: number) {
		// not null rather than falsy, otherwise it won't work on first tag(0)
		return (
			currentStartTagStart !== null && isInsideExpression(content, currentStartTagStart, offset)
		);
	}

	function blankStartOrEndTagLike(offset: number, state?: html.ScannerState) {
		content = content.substring(0, offset) + ' ' + content.substring(offset + 1);
		scanner = createScanner(content, offset, state ?? html.ScannerState.WithinTag);
	}
}

function getHTMLVirtualCode(preprocessedHTML: string): VirtualCode {
	return {
		id: `html`,
		languageId: 'html',
		snapshot: {
			getText: (start, end) => preprocessedHTML.substring(start, end),
			getLength: () => preprocessedHTML.length,
			getChangeRange: () => undefined,
		},
		mappings: [
			{
				sourceOffsets: [0],
				generatedOffsets: [0],
				lengths: [preprocessedHTML.length],
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
		embeddedCodes: [],
	};
}

function getHTMLDocument(preprocessedHTML: string): html.HTMLDocument {
	return htmlLs.parseHTMLDocument({ getText: () => preprocessedHTML } as any);
}
