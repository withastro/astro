import {
	AstroFrontmatterStatus,
	type ConvertToTsxResult,
	type ExtractedScript,
	type ExtractedStyle,
	convertToTsx,
} from '@astrojs/astro2tsx';
import type { CodeMapping, VirtualCode } from '@volar/language-core';
import { Range } from '@volar/language-server';
import { TextDocument } from 'vscode-html-languageservice';
import { patchTSXWithMetadata } from './utils.js';

export interface LSPTSXRanges {
	frontmatter: Range;
	body: Range;
	scripts: ExtractedScript[];
	styles: ExtractedStyle[];
	generatedComponentExport?: Range;
}

export function safeConvertToTSX(
	content: string,
	options: { filename?: string },
): ConvertToTsxResult {
	const fileName = options.filename ?? '';
	try {
		return convertToTsx(content, { filename: fileName, sourcemap: false });
	} catch (e) {
		console.error(
			`There was an error transforming ${fileName} to TSX. An empty file will be returned instead. Please create an issue: https://github.com/withastro/astro/issues\nError: ${e}.`,
		);

		return {
			code: '',
			generatedOffsets: new Uint32Array(),
			sourceOffsets: new Uint32Array(),
			lengths: new Uint32Array(),
			frontmatter: { start: 0, end: 0 },
			body: { start: 0, end: 0 },
			frontmatterStatus: AstroFrontmatterStatus.DoesntExist,
			frontmatterSource: { start: 0, end: 0 },
			scripts: [],
			styles: [],
			diagnostics: [
				{
					message: `The Astro compiler encountered an unknown error while transforming this file to TSX. Please create an issue with your code and the error shown in the server's logs: https://github.com/withastro/astro/issues`,
					severity: 1,
					position: { start: 0, end: content.length },
				},
			],
			hasParseErrors: true,
		} satisfies ConvertToTsxResult;
	}
}

export function getTSXRangesAsLSPRanges(tsx: ConvertToTsxResult): LSPTSXRanges {
	const textDocument = TextDocument.create('', 'typescriptreact', 0, tsx.code);

	return {
		frontmatter: Range.create(
			textDocument.positionAt(tsx.frontmatter.start),
			textDocument.positionAt(tsx.frontmatter.end),
		),
		body: Range.create(
			textDocument.positionAt(tsx.body.start),
			textDocument.positionAt(tsx.body.end),
		),
		scripts: tsx.scripts,
		styles: tsx.styles,
	};
}

export function astro2tsx(input: string, fileName: string) {
	const tsx = safeConvertToTSX(input, { filename: fileName });
	const { virtualCode, generatedComponentExport } = getVirtualCodeTSX(tsx, fileName);

	return {
		virtualCode,
		diagnostics: tsx.diagnostics,
		ranges: { ...getTSXRangesAsLSPRanges(tsx), generatedComponentExport },
		frontmatterStatus: tsx.frontmatterStatus,
		frontmatterSource: tsx.frontmatterSource,
	};
}

function getVirtualCodeTSX(tsx: ConvertToTsxResult, fileName: string) {
	// Only the trailing scaffolding is rewritten, so mapped offsets keep their meaning.
	const patched = patchTSXWithMetadata(tsx.code, fileName);
	const code = patched.code;
	const mappings: CodeMapping[] = [
		{
			sourceOffsets: Array.from(tsx.sourceOffsets),
			generatedOffsets: Array.from(tsx.generatedOffsets),
			lengths: Array.from(tsx.lengths),
			data: {
				verification: true,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
			},
		},
	];

	const genDoc = TextDocument.create('', 'typescriptreact', 0, code);

	return {
		virtualCode: {
			id: 'tsx',
			languageId: 'typescriptreact',
			snapshot: {
				getText: (start, end) => code.substring(start, end),
				getLength: () => code.length,
				getChangeRange: () => undefined,
			},
			mappings,
			embeddedCodes: [],
		} satisfies VirtualCode,
		generatedComponentExport: patched.generatedComponentExport
			? Range.create(
					genDoc.positionAt(patched.generatedComponentExport.start),
					genDoc.positionAt(patched.generatedComponentExport.end),
				)
			: undefined,
	};
}
