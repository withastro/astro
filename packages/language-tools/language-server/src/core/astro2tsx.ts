import { type ConvertToTsxResult, convertToTsx } from '@astrojs/astro2tsx';
import type { CodeMapping, VirtualCode } from '@volar/language-core';
import { Range } from '@volar/language-server';
import { TextDocument } from 'vscode-html-languageservice';
import { patchTSX } from './utils.js';

export interface TSXExtractedTag {
	position: { start: number; end: number };
	content: string;
	lang?: string;
}

export interface TSXExtractedScript extends TSXExtractedTag {
	type: 'processed-module' | 'module' | 'inline' | 'event-attribute' | 'json' | 'raw' | 'unknown';
}

export interface TSXExtractedStyle extends TSXExtractedTag {
	type: 'tag' | 'style-attribute';
	lang: string;
}

export interface CompilerDiagnostic {
	message: string;
	severity: number;
	position: { start: number; end: number };
}

export interface LSPTSXRanges {
	frontmatter: Range;
	body: Range;
	scripts: TSXExtractedScript[];
	styles: TSXExtractedStyle[];
}

export function safeConvertToTSX(
	content: string,
	options: { filename?: string },
): ConvertToTsxResult {
	const fileName = options.filename ?? '';
	try {
		return convertToTsx(content, { filename: fileName, sourcemap: 'external' });
	} catch (e) {
		console.error(
			`There was an error transforming ${fileName} to TSX. An empty file will be returned instead. Please create an issue: https://github.com/withastro/astro/issues\nError: ${e}.`,
		);

		return {
			code: '',
			map: '',
			generatedOffsets: new Uint32Array(),
			sourceOffsets: new Uint32Array(),
			lengths: new Uint32Array(),
			frontmatter: { start: 0, end: 0 },
			body: { start: 0, end: 0 },
			frontmatterStatus: 'doesnt-exist',
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
		} as ConvertToTsxResult;
	}
}

/** The script family doubles as the `type` the embedded-code builders switch on. */
function toScripts(tsx: ConvertToTsxResult): TSXExtractedScript[] {
	return tsx.scripts.map((script) => ({
		position: script.position,
		content: script.content,
		type: (script.kind === 'event-attribute'
			? 'event-attribute'
			: (script.lang ?? 'unknown')) as TSXExtractedScript['type'],
	}));
}

function toStyles(tsx: ConvertToTsxResult): TSXExtractedStyle[] {
	return tsx.styles.map((style) => ({
		position: style.position,
		content: style.content,
		type: style.kind === 'style-attribute' ? 'style-attribute' : 'tag',
		lang: style.lang ?? 'css',
	}));
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
		scripts: toScripts(tsx),
		styles: toStyles(tsx),
	};
}

export function astro2tsx(input: string, fileName: string) {
	const tsx = safeConvertToTSX(input, { filename: fileName });

	return {
		virtualCode: getVirtualCodeTSX(tsx, fileName),
		diagnostics: tsx.diagnostics as CompilerDiagnostic[],
		ranges: getTSXRangesAsLSPRanges(tsx),
		frontmatterStatus: tsx.frontmatterStatus,
		frontmatterSource: tsx.frontmatterSource,
	};
}

function getVirtualCodeTSX(tsx: ConvertToTsxResult, fileName: string): VirtualCode {
	// Only the trailing scaffolding is rewritten, so mapped offsets keep their meaning.
	const code = patchTSX(tsx.code, fileName);
	const mappings: CodeMapping[] = tsx.generatedOffsets.length
		? [
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
			]
		: [];

	return {
		id: 'tsx',
		languageId: 'typescriptreact',
		snapshot: {
			getText: (start, end) => code.substring(start, end),
			getLength: () => code.length,
			getChangeRange: () => undefined,
		},
		mappings,
		embeddedCodes: [],
	};
}
