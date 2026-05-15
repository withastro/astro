'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.safeConvertToTSX = safeConvertToTSX;
exports.getTSXRangesAsLSPRanges = getTSXRangesAsLSPRanges;
exports.astro2tsx = astro2tsx;
const sync_1 = require('@astrojs/compiler/sync');
const sourcemap_codec_1 = require('@jridgewell/sourcemap-codec');
const language_server_1 = require('@volar/language-server');
const vscode_html_languageservice_1 = require('vscode-html-languageservice');
const utils_js_1 = require('./utils.js');
function safeConvertToTSX(content, options) {
	try {
		const tsx = (0, sync_1.convertToTSX)(content, {
			filename: options.filename,
			includeScripts: false,
			includeStyles: false,
		});
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
					location: { file: options.filename, line: 1, column: 1, length: content.length },
					severity: 1,
					text: `The Astro compiler encountered an unknown error while transform this file to TSX. Please create an issue with your code and the error shown in the server's logs: https://github.com/withastro/astro/issues`,
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
				scripts: [],
				styles: [],
			},
		};
	}
}
function getTSXRangesAsLSPRanges(tsx) {
	const textDocument = vscode_html_languageservice_1.TextDocument.create(
		'',
		'typescriptreact',
		0,
		tsx.code,
	);
	return {
		frontmatter: language_server_1.Range.create(
			textDocument.positionAt(tsx.metaRanges.frontmatter.start),
			textDocument.positionAt(tsx.metaRanges.frontmatter.end),
		),
		body: language_server_1.Range.create(
			textDocument.positionAt(tsx.metaRanges.body.start),
			textDocument.positionAt(tsx.metaRanges.body.end),
		),
		scripts: tsx.metaRanges.scripts ?? [],
		styles: tsx.metaRanges.styles ?? [],
	};
}
function astro2tsx(input, fileName) {
	const tsx = safeConvertToTSX(input, { filename: fileName });
	return {
		virtualCode: getVirtualCodeTSX(input, tsx, fileName),
		diagnostics: tsx.diagnostics,
		ranges: getTSXRangesAsLSPRanges(tsx),
	};
}
function getVirtualCodeTSX(input, tsx, fileName) {
	tsx.code = (0, utils_js_1.patchTSX)(tsx.code, fileName);
	const v3Mappings = (0, sourcemap_codec_1.decode)(tsx.map.mappings);
	const sourcedDoc = vscode_html_languageservice_1.TextDocument.create('', 'astro', 0, input);
	const genDoc = vscode_html_languageservice_1.TextDocument.create(
		'',
		'typescriptreact',
		0,
		tsx.code,
	);
	const mappings = [];
	let current;
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
//# sourceMappingURL=astro2tsx.js.map
