'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, '__esModule', { value: true });
exports.parseHTML = parseHTML;
exports.preprocessHTML = preprocessHTML;
const html = __importStar(require('vscode-html-languageservice'));
const utils_1 = require('../plugins/utils');
const htmlLs = html.getLanguageService();
function parseHTML(snapshot, frontmatterEnd) {
	const htmlContent = preprocessHTML(snapshot.getText(0, snapshot.getLength()), frontmatterEnd);
	return {
		virtualCode: getHTMLVirtualCode(htmlContent),
		htmlDocument: getHTMLDocument(htmlContent),
	};
}
const createScanner = htmlLs.createScanner;
/**
 * scan the text and remove any `>` or `<` that cause the tag to end short
 */
function preprocessHTML(text, frontmatterEnd) {
	let content = text.split('').fill(' ', 0, frontmatterEnd).join('');
	let scanner = createScanner(content);
	let token = scanner.scan();
	let currentStartTagStart = null;
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
	function shouldBlankStartOrEndTagLike(offset) {
		// not null rather than falsy; otherwise, it won't work on first tag(0)
		return (
			currentStartTagStart !== null &&
			(0, utils_1.isInsideExpression)(content, currentStartTagStart, offset)
		);
	}
	function blankStartOrEndTagLike(offset, state) {
		content = content.substring(0, offset) + ' ' + content.substring(offset + 1);
		scanner = createScanner(content, offset, state ?? html.ScannerState.WithinTag);
	}
}
function getHTMLVirtualCode(preprocessedHTML) {
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
function getHTMLDocument(preprocessedHTML) {
	return htmlLs.parseHTMLDocument({ getText: () => preprocessedHTML });
}
//# sourceMappingURL=parseHTML.js.map
