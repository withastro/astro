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
