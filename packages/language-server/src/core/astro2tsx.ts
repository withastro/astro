import { convertToTSX } from '@astrojs/compiler/sync';
import type { TSXResult } from '@astrojs/compiler/types';
import { decode } from '@jridgewell/sourcemap-codec';
import { FileKind, FileRangeCapabilities, VirtualFile } from '@volar/language-core';
import { HTMLDocument, TextDocument } from 'vscode-html-languageservice';
import { patchTSX } from './utils.js';

export function astro2tsx(
	input: string,
	fileName: string,
	ts: typeof import('typescript/lib/tsserverlibrary.js'),
	htmlDocument: HTMLDocument
) {
	const tsx = convertToTSX(input, { filename: fileName });

	return {
		virtualFile: getVirtualFileTSX(input, tsx, fileName, ts, htmlDocument),
		diagnostics: tsx.diagnostics,
	};
}

function getVirtualFileTSX(
	input: string,
	tsx: TSXResult,
	fileName: string,
	ts: typeof import('typescript/lib/tsserverlibrary.js'),
	htmlDocument: HTMLDocument
): VirtualFile {
	tsx.code = patchTSX(tsx.code);
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

	// Ensure that `0:0` is mapped to `0:0` to make sure we properly handle "unmapped" lines
	mappings.push({
		sourceRange: [0, 0],
		generatedRange: [0, 0],
		data: {},
	});

	const ast = ts.createSourceFile('/a.tsx', tsx.code, ts.ScriptTarget.ESNext);
	mappings.push({
		sourceRange: [0, input.length],
		generatedRange: [ast.statements[0].getStart(ast), tsx.code.length],
		data: {},
	});

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
