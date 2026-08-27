import { type ConvertToTsxResult, DiagnosticSeverity, convertToTsx } from '@astrojs/astro2tsx';
import { toSpanMappings } from './mappings.js';
import type { MapperDiagnostic, TransformParams, TransformResult } from './protocol.js';

const VIRTUAL_EXTENSION = '.tsx';

export const PARSE_ERROR_CODE = 1000;
export const INTERNAL_ERROR_CODE = 1001;

/** Importers of a broken component still resolve a default export, so their errors stay local. */
const FALLBACK_TSX = 'export default function (_props: Record<string, any>): any {}\n';

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
			sourcemap: false,
			// No language server injects globals here, so the TSX has to declare its own.
			ambientTypes: true,
		});

		return {
			text: tsx.code,
			extension: VIRTUAL_EXTENSION,
			mappings: toSpanMappings(content, tsx),
			diagnostics: toMapperDiagnostics(tsx, content),
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
