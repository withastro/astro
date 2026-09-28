import {
	type ConvertToTsxResult,
	DiagnosticSeverity,
	ExtractedScriptType,
	convertToTsx,
} from '@astrojs/astro2tsx';
import type {
	MapperDiagnostic,
	SupplementalOutput,
	TransformParams,
	TransformResult,
} from './protocol.js';

const VIRTUAL_EXTENSION = '.tsx';

export const PARSE_ERROR_CODE = 1000;
export const INTERNAL_ERROR_CODE = 1001;

/** Importers of a broken component still resolve a default export, so their errors stay local. */
const FALLBACK_TSX = 'export default function (_props: Record<string, any>): any {}\n';

function toSupplementalScripts(tsx: ConvertToTsxResult): SupplementalOutput[] {
	const modules = tsx.scripts.flatMap<SupplementalOutput>((script) => {
		let extension: SupplementalOutput['extension'];

		switch (script.type) {
			case ExtractedScriptType.ProcessedModule:
				extension = '.mts';
				break;
			case ExtractedScriptType.Module:
				extension = '.mjs';
				break;
			case ExtractedScriptType.Inline:
			case ExtractedScriptType.EventAttribute:
			case ExtractedScriptType.Json:
			case ExtractedScriptType.Raw:
			case ExtractedScriptType.Unknown:
				return [];
		}

		return [
			{
				text: script.content,
				extension,
				mappings: [[0, script.content.length, script.position.start, script.content.length, 0]],
			},
		];
	});

	const inlineScripts = tsx.scripts
		.filter(
			(script) =>
				script.type === ExtractedScriptType.Inline ||
				script.type === ExtractedScriptType.EventAttribute ||
				script.type === ExtractedScriptType.Unknown,
		)
		.sort((a, b) => a.position.start - b.position.start);

	if (inlineScripts.length === 0) return modules;

	let text = '';
	const mappings: SupplementalOutput['mappings'] = [];
	for (const script of inlineScripts) {
		mappings.push([
			text.length,
			script.content.length,
			script.position.start,
			script.content.length,
			0,
		]);
		// Keep errors in one inline context from spreading into the next one.
		text += `${script.content};`;
	}

	return [...modules, { text, extension: '.mjs', mappings }];
}

function toMapperDiagnostics(tsx: ConvertToTsxResult, source: string): MapperDiagnostic[] {
	const diagnostics: MapperDiagnostic[] = [];

	for (const diagnostic of tsx.diagnostics) {
		if (diagnostic.severity !== DiagnosticSeverity.Error) continue;

		const start = Math.max(0, Math.min(diagnostic.position.start, source.length));
		const end = Math.max(start, Math.min(diagnostic.position.end, source.length));

		diagnostics.push({
			messageText: diagnostic.message,
			start,
			length: end - start,
			code: PARSE_ERROR_CODE,
		});
	}

	return diagnostics;
}

export function transform({ content, fileName }: TransformParams): TransformResult {
	try {
		const tsx = convertToTsx(content, {
			filename: fileName,
			// No language server injects globals here, so the TSX has to declare its own.
			ambientTypes: true,
		});

		return {
			text: tsx.code,
			extension: VIRTUAL_EXTENSION,
			mappings: tsx.mappings,
			diagnostics: toMapperDiagnostics(tsx, content),
			supplemental: toSupplementalScripts(tsx),
		};
	} catch (error) {
		return {
			text: FALLBACK_TSX,
			extension: VIRTUAL_EXTENSION,
			mappings: [],
			diagnostics: [
				{
					messageText: `The Astro compiler failed to transform this file to TSX: ${error instanceof Error ? error.message : String(error)}`,
					start: 0,
					length: content.length,
					code: INTERNAL_ERROR_CODE,
				},
			],
		};
	}
}
