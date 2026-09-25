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

const SPAN_MAP_KIND_ATOM = 1;

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
		return convertToTsx(content, { filename: fileName });
	} catch (e) {
		console.error(
			`There was an error transforming ${fileName} to TSX. An empty file will be returned instead. Please create an issue: https://github.com/withastro/astro/issues\nError: ${e}.`,
		);

		return {
			code: '',
			mappings: [],
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
	const { virtualCode, generatedComponentExport } = getVirtualCodeTSX(tsx);

	return {
		virtualCode,
		diagnostics: tsx.diagnostics,
		ranges: { ...getTSXRangesAsLSPRanges(tsx), generatedComponentExport },
		frontmatterStatus: tsx.frontmatterStatus,
		frontmatterSource: tsx.frontmatterSource,
	};
}

function getVirtualCodeTSX(tsx: ConvertToTsxResult) {
	const code = tsx.code;
	const mapped = tsx.mappings
		.filter(([, generatedLength, , sourceLength]) => generatedLength > 0 && sourceLength > 0)
		.map(([generatedOffset, generatedLength, sourceOffset, sourceLength]) => ({
			generatedOffset,
			sourceOffset,
			length: Math.min(generatedLength, sourceLength),
		}));
	const mappings: CodeMapping[] = [
		{
			sourceOffsets: mapped.map(({ sourceOffset }) => sourceOffset),
			generatedOffsets: mapped.map(({ generatedOffset }) => generatedOffset),
			lengths: mapped.map(({ length }) => length),
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
	for (const [generatedOffset, generatedLength, sourceOffset, sourceLength, kind, features] of tsx.mappings) {
		if (
			generatedLength === 0 ||
			sourceLength !== 0 ||
			kind !== SPAN_MAP_KIND_ATOM ||
			features !== undefined
		) {
			continue;
		}

		const previous = [...mapped].reverse().find(
			(mapping) =>
				mapping.sourceOffset + mapping.length === sourceOffset &&
				mapping.generatedOffset + mapping.length <= generatedOffset,
		);
		if (!previous) continue;

		// Include the preceding source-backed run so edits spanning into generated-only
		// text map as one range, ending at the atom's zero-width source anchor.
		mappings.push({
			sourceOffsets: [previous.sourceOffset],
			generatedOffsets: [previous.generatedOffset],
			lengths: [previous.length],
			generatedLengths: [generatedOffset + generatedLength - previous.generatedOffset],
			// Volar uses verification for code actions and navigation when mapping their edits.
			data: { verification: true, navigation: true },
		});
	}
	if (tsx.frontmatterStatus === AstroFrontmatterStatus.DoesntExist) {
		// TypeScript inserts auto-imports into the synthetic newline before the template. Map it
		// to the start of the Astro file so completion edits can create a frontmatter section.
		mappings.push({
			sourceOffsets: [0],
			generatedOffsets: [tsx.frontmatter.start - 1],
			lengths: [0],
			generatedLengths: [1],
			data: { completion: true },
		});
	}

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
		generatedComponentExport: tsx.generatedComponentExport
			? Range.create(
					genDoc.positionAt(tsx.generatedComponentExport.start),
					genDoc.positionAt(tsx.generatedComponentExport.end),
				)
			: undefined,
	};
}
