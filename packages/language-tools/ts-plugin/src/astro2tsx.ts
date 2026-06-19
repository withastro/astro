import path from 'node:path';
import { convertToTSX } from '@astrojs/compiler/sync';
import type { ConvertToTSXOptions, TSXResult } from '@astrojs/compiler/types';
import { decode } from '@jridgewell/sourcemap-codec';
import type { CodeMapping, VirtualCode } from '@volar/language-core';
import { TextDocument } from 'vscode-languageserver-textdocument';

function safeConvertToTSX(content: string, options: ConvertToTSXOptions) {
	try {
		const tsx = convertToTSX(content, { filename: options.filename });
		return tsx;
	} catch (e) {
		console.error(
			`There was an error transforming ${options.filename} to TSX. An empty file will be returned instead. Please create an issue: https://github.com/withastro/astro/issues\nError: ${e}.`,
		);

		return {
			code: '',
			map: {
				file: options.filename ?? '',
				sources: [],
				sourcesContent: [],
				names: [],
				mappings: '',
				version: 0,
			},
			diagnostics: [
				{
					code: 1000,
					location: { file: options.filename!, line: 1, column: 1, length: content.length },
					severity: 1,
					text: `The Astro compiler encountered an unknown error while parsing this file. Please create an issue with your code and the error shown in the server's logs: https://github.com/withastro/astro/issues`,
				},
			],
			metaRanges: {
				frontmatter: {
					start: 0,
					end: 0,
				},
				body: {
					start: 0,
					end: 0,
				},
			},
		} satisfies TSXResult;
	}
}

export function astro2tsx(input: string, fileName: string) {
	const tsx = safeConvertToTSX(input, { filename: fileName });

	return {
		virtualFile: getVirtualFileTSX(input, tsx, fileName),
		diagnostics: tsx.diagnostics,
	};
}

function getVirtualFileTSX(input: string, tsx: TSXResult, fileName: string): VirtualCode {
	tsx.code = patchTSX(tsx.code, fileName);
	tsx.code = patchFrontmatterReturns(
		tsx.code,
		tsx.metaRanges.frontmatter.start,
		tsx.metaRanges.frontmatter.end,
	);
	const v3Mappings = decode(tsx.map.mappings);
	const sourcedDoc = TextDocument.create(fileName, 'astro', 0, input);
	const genDoc = TextDocument.create(fileName + '.tsx', 'typescriptreact', 0, tsx.code);
	const mappings: CodeMapping[] = [];

	let current:
		| {
				genOffset: number;
				sourceOffset: number;
		  }
		| undefined;

	for (let genLine = 0; genLine < v3Mappings.length; genLine++) {
		for (const segment of v3Mappings[genLine]) {
			const genCharacter = segment[0];
			const genOffset = genDoc.offsetAt({ line: genLine, character: genCharacter });
			if (current) {
				let length = genOffset - current.genOffset;
				const sourceText = input.substring(current.sourceOffset, current.sourceOffset + length);
				const genText = tsx.code.substring(current.genOffset, current.genOffset + length);
				if (sourceText !== genText) {
					length = 0;
					for (let i = 0; i < genOffset - current.genOffset; i++) {
						if (sourceText[i] === genText[i]) {
							length = i + 1;
						} else {
							break;
						}
					}
				}
				if (length > 0) {
					const lastMapping = mappings.length ? mappings[mappings.length - 1] : undefined;
					if (
						lastMapping &&
						lastMapping.generatedOffsets[0] + lastMapping.lengths[0] === current.genOffset &&
						lastMapping.sourceOffsets[0] + lastMapping.lengths[0] === current.sourceOffset
					) {
						lastMapping.lengths[0] += length;
					} else {
						mappings.push({
							sourceOffsets: [current.sourceOffset],
							generatedOffsets: [current.genOffset],
							lengths: [length],
							data: {
								verification: true,
								completion: true,
								semantic: true,
								navigation: true,
								structure: true,
								format: false,
							},
						});
					}
				}
				current = undefined;
			}
			if (segment[2] !== undefined && segment[3] !== undefined) {
				const sourceOffset = sourcedDoc.offsetAt({ line: segment[2], character: segment[3] });
				current = {
					genOffset,
					sourceOffset,
				};
			}
		}
	}

	return {
		id: 'tsx',
		languageId: 'typescriptreact',
		snapshot: {
			getText: (start, end) => tsx.code.substring(start, end),
			getLength: () => tsx.code.length,
			getChangeRange: () => undefined,
		},
		mappings: mappings,
		embeddedCodes: [],
	};
}

function patchTSX(code: string, fileName: string) {
	const basename = path.basename(fileName, path.extname(fileName));
	const isDynamic = basename.startsWith('[') && basename.endsWith(']');

	return code.replace(/\b(\S*)__AstroComponent_/g, (fullMatch, m1: string) => {
		// If we don't have a match here, it usually means the file has a weird name that couldn't be expressed with valid identifier characters
		if (!m1) {
			if (basename === '404') return 'FourOhFour';
			return fullMatch;
		}
		return isDynamic ? `_${m1}_` : m1[0].toUpperCase() + m1.slice(1);
	});
}

/**
 * Replace top-level `return` keywords with `throw ` in the frontmatter portion of the TSX.
 *
 * Top-level returns are valid in Astro frontmatter (used for SSR early returns) but appear at
 * module level in the generated TSX where `return` is syntactically invalid. This causes TypeScript
 * to not track variable references inside the return expression, producing false TS6133 diagnostics.
 * `throw ` is the same 6-char length as `return`, preserving sourcemap accuracy.
 */
function patchFrontmatterReturns(code: string, start: number, end: number): string {
	const frontmatter = code.substring(start, end);
	const positions = findTopLevelReturnPositions(frontmatter);
	if (positions.length === 0) return code;

	let result = code.substring(0, start);
	let last = 0;
	for (const pos of positions) {
		result += frontmatter.substring(last, pos) + 'throw ';
		last = pos + 6;
	}
	return result + frontmatter.substring(last) + code.substring(end);
}

const JS_KEYWORDS = new Set([
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'if',
	'import',
	'in',
	'instanceof',
	'let',
	'new',
	'null',
	'of',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'async',
	'await',
	'enum',
]);

/**
 * Find byte positions of top-level `return` keywords (not inside any function/arrow/method body).
 */
function findTopLevelReturnPositions(source: string): number[] {
	const returns: number[] = [];
	const len = source.length;
	let i = 0;

	const functionScopeStack: number[] = [];
	let braceDepth = 0;
	let parenDepth = 0;
	let expectingFunctionBody = false;
	let parenDepthAtFunctionStart = -1;
	let identParenDepth = -1;
	let wentThroughParens = false;

	while (i < len) {
		const ch = source.charCodeAt(i);

		// Skip whitespace
		if (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
			i++;
			continue;
		}

		// Skip string literals
		if (ch === 34 || ch === 39 || ch === 96) {
			i = skipStringLiteral(source, i);
			expectingFunctionBody = false;
			identParenDepth = -1;
			wentThroughParens = false;
			continue;
		}

		// Skip comments
		if (ch === 47 && i + 1 < len) {
			const next = source.charCodeAt(i + 1);
			if (next === 47) {
				while (i < len && source.charCodeAt(i) !== 10) i++;
				continue;
			}
			if (next === 42) {
				i += 2;
				while (i < len - 1 && !(source.charCodeAt(i) === 42 && source.charCodeAt(i + 1) === 47))
					i++;
				i += 2;
				continue;
			}
		}

		if (ch === 40) {
			parenDepth++;
			i++;
			continue;
		} // (
		if (ch === 41) {
			// )
			parenDepth--;
			if (parenDepthAtFunctionStart >= 0 && parenDepth === parenDepthAtFunctionStart) {
				expectingFunctionBody = true;
				parenDepthAtFunctionStart = -1;
			}
			if (identParenDepth >= 0 && parenDepth === identParenDepth) {
				wentThroughParens = true;
			}
			i++;
			continue;
		}

		// =>
		if (ch === 61 && i + 1 < len && source.charCodeAt(i + 1) === 62) {
			expectingFunctionBody = true;
			identParenDepth = -1;
			wentThroughParens = false;
			i += 2;
			continue;
		}

		// ; resets arrow expectation for concise arrow bodies like `=> expr;`
		if (ch === 59) {
			expectingFunctionBody = false;
			identParenDepth = -1;
			wentThroughParens = false;
			i++;
			continue;
		}

		if (ch === 123) {
			// {
			if (expectingFunctionBody || wentThroughParens) {
				functionScopeStack.push(braceDepth);
				expectingFunctionBody = false;
			}
			braceDepth++;
			identParenDepth = -1;
			wentThroughParens = false;
			i++;
			continue;
		}
		if (ch === 125) {
			// }
			braceDepth--;
			if (
				functionScopeStack.length > 0 &&
				braceDepth === functionScopeStack[functionScopeStack.length - 1]
			) {
				functionScopeStack.pop();
			}
			identParenDepth = -1;
			wentThroughParens = false;
			i++;
			continue;
		}

		if (ch === 91 || ch === 93) {
			i++;
			continue;
		} // [ ]

		// Identifiers and keywords
		if (isIdentStart(ch)) {
			const start = i;
			while (i < len && isIdentPart(source.charCodeAt(i))) i++;
			const word = source.substring(start, i);

			if (word === 'return') {
				if (functionScopeStack.length === 0) returns.push(start);
				expectingFunctionBody = false;
			} else if (word === 'function') {
				parenDepthAtFunctionStart = parenDepth;
				identParenDepth = -1;
				wentThroughParens = false;
			} else if (!JS_KEYWORDS.has(word)) {
				identParenDepth = parenDepth;
				wentThroughParens = false;
			} else {
				identParenDepth = -1;
				wentThroughParens = false;
				expectingFunctionBody = false;
			}
			continue;
		}

		identParenDepth = -1;
		i++;
	}

	return returns;
}

function skipStringLiteral(source: string, start: number): number {
	const quote = source.charCodeAt(start);
	let i = start + 1;
	const len = source.length;
	if (quote === 96) {
		// template literal
		let depth = 0;
		while (i < len) {
			const ch = source.charCodeAt(i);
			if (ch === 92) {
				i += 2;
				continue;
			} // backslash escape
			if (ch === 36 && i + 1 < len && source.charCodeAt(i + 1) === 123) {
				depth++;
				i += 2;
				continue;
			} // ${
			if (ch === 125 && depth > 0) {
				depth--;
				i++;
				continue;
			} // }
			if (ch === 96 && depth === 0) return i + 1;
			i++;
		}
	} else {
		while (i < len) {
			const ch = source.charCodeAt(i);
			if (ch === 92) {
				i += 2;
				continue;
			}
			if (ch === quote) return i + 1;
			i++;
		}
	}
	return i;
}

function isIdentStart(ch: number): boolean {
	return (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90) || ch === 95 || ch === 36;
}

function isIdentPart(ch: number): boolean {
	return isIdentStart(ch) || (ch >= 48 && ch <= 57);
}
