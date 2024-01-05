import { convertToTSX } from '@astrojs/compiler/sync';
import type { ConvertToTSXOptions, DiagnosticMessage, TSXResult } from '@astrojs/compiler/types';
import { decode } from '@jridgewell/sourcemap-codec';
import { FileKind, FileRangeCapabilities, VirtualFile } from '@volar/language-core';
import { Range } from '@volar/language-server';
import { HTMLDocument, TextDocument } from 'vscode-html-languageservice';
import { patchTSX } from './utils.js';

export interface LSPTSXRanges {
	frontmatter: Range;
	body: Range;
}

interface Astro2TSXResult {
	virtualFile: VirtualFile;
	diagnostics: DiagnosticMessage[];
	ranges: LSPTSXRanges;
}

export function safeConvertToTSX(content: string, options: ConvertToTSXOptions) {
	try {
		const tsx = convertToTSX(content, { filename: options.filename });
		return tsx;
	} catch (e) {
		console.error(
			`There was an error transforming ${options.filename} to TSX. An empty file will be returned instead. Please create an issue: https://github.com/withastro/language-tools/issues\nError: ${e}.`
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
					text: `The Astro compiler encountered an unknown error while transform this file to TSX. Please create an issue with your code and the error shown in the server's logs: https://github.com/withastro/language-tools/issues`,
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

export function getTSXRangesAsLSPRanges(tsx: TSXResult): LSPTSXRanges {
	const textDocument = TextDocument.create('', 'typescriptreact', 0, tsx.code);

	return {
		frontmatter: Range.create(
			textDocument.positionAt(tsx.metaRanges.frontmatter.start),
			textDocument.positionAt(tsx.metaRanges.frontmatter.end)
		),
		body: Range.create(
			textDocument.positionAt(tsx.metaRanges.body.start),
			textDocument.positionAt(tsx.metaRanges.body.end)
		),
	};
}

export function astro2tsx(
	input: string,
	fileName: string,
	ts: typeof import('typescript/lib/tsserverlibrary.js'),
	htmlDocument: HTMLDocument
): Astro2TSXResult {
	const tsx = safeConvertToTSX(input, { filename: fileName });

	return {
		virtualFile: getVirtualFileTSX(input, tsx, fileName, ts, htmlDocument),
		diagnostics: tsx.diagnostics,
		ranges: getTSXRangesAsLSPRanges(tsx),
	};
}

function getVirtualFileTSX(
	input: string,
	tsx: TSXResult,
	fileName: string,
	ts: typeof import('typescript/lib/tsserverlibrary.js'),
	htmlDocument: HTMLDocument
): VirtualFile {
	tsx.code = patchTSX(tsx.code, fileName);
	const v3Mappings = decode(tsx.map.mappings);
	const sourcedDoc = TextDocument.create(fileName, 'astro', 0, input);
	const genDoc = TextDocument.create(fileName + '.tsx', 'typescriptreact', 0, tsx.code);

	const mappings: VirtualFile['mappings'] = [];

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
						lastMapping.generatedRange[1] === current.genOffset &&
						lastMapping.sourceRange[1] === current.sourceOffset
					) {
						lastMapping.generatedRange[1] = current.genOffset + length;
						lastMapping.sourceRange[1] = current.sourceOffset + length;
					} else {
						// Disable features inside script tags. This is a bit annoying to do, I wonder if maybe leaving script tags
						// unmapped would be better.
						const node = htmlDocument.findNodeAt(current.sourceOffset);
						const rangeCapabilities: FileRangeCapabilities =
							node.tag !== 'script'
								? FileRangeCapabilities.full
								: {
										completion: false,
										definition: false,
										diagnostic: false,
										displayWithLink: false,
										hover: false,
										references: false,
										referencesCodeLens: false,
										rename: false,
										semanticTokens: false,
								  };

						mappings.push({
							sourceRange: [current.sourceOffset, current.sourceOffset + length],
							generatedRange: [current.genOffset, current.genOffset + length],
							data: rangeCapabilities,
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

	const ast = ts.createSourceFile('/a.tsx', tsx.code, ts.ScriptTarget.ESNext);
	if (ast.statements[0]) {
		mappings.push({
			sourceRange: [0, input.length],
			generatedRange: [ast.statements[0].getStart(ast), tsx.code.length],
			data: {},
		});
	}

	return {
		fileName: fileName + '.tsx',
		kind: FileKind.TypeScriptHostFile,
		capabilities: {
			codeAction: true,
			documentFormatting: false,
			diagnostic: true,
			documentSymbol: true,
			inlayHint: true,
			foldingRange: true,
		},
		codegenStacks: [],
		snapshot: {
			getText: (start, end) => tsx.code.substring(start, end),
			getLength: () => tsx.code.length,
			getChangeRange: () => undefined,
		},
		mappings: mappings,
		embeddedFiles: [],
	};
}
