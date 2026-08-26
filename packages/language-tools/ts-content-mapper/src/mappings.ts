import type { ConvertToTsxResult } from '@astrojs/astro2tsx';
import { type SpanMapping, SpanMapFeature, SpanMapKind } from './protocol.js';

const COMPONENT_SUFFIX = '__AstroComponent_';

/** TypeScript dropped its go-to-definition fallback for unmapped virtual exports, so this anchor is required. */
const EXPORT_ANCHOR_FEATURES = SpanMapFeature.Definition | SpanMapFeature.References;

function findComponentExportSpan(generated: string) {
	const suffixEnd = generated.lastIndexOf(COMPONENT_SUFFIX);
	if (suffixEnd === -1) return undefined;

	const nameStart = generated.lastIndexOf(' ', suffixEnd) + 1;
	if (nameStart <= 0 || nameStart > suffixEnd) return undefined;

	return { start: nameStart, length: suffixEnd + COMPONENT_SUFFIX.length - nameStart };
}

/** TypeScript rejects the entire transform when virtual spans overlap, so a colliding span is dropped. */
function pruneOverlaps(mappings: SpanMapping[]): SpanMapping[] {
	const ordered = [...mappings].sort((a, b) => a[0] - b[0]);
	const result: SpanMapping[] = [];
	let previousEnd = 0;

	for (const mapping of ordered) {
		if (mapping[0] < previousEnd) continue;
		result.push(mapping);
		previousEnd = mapping[0] + mapping[1];
	}

	return result;
}

export function toSpanMappings(source: string, tsx: ConvertToTsxResult): SpanMapping[] {
	const generated = tsx.code;
	const mappings: SpanMapping[] = [];
	const runCount = Math.min(
		tsx.generatedOffsets.length,
		tsx.sourceOffsets.length,
		tsx.lengths.length,
	);

	for (let i = 0; i < runCount; i++) {
		const virtualStart = tsx.generatedOffsets[i];
		const originalStart = tsx.sourceOffsets[i];
		const length = tsx.lengths[i];

		if (length === 0) continue;
		if (virtualStart + length > generated.length) continue;
		if (originalStart + length > source.length) continue;

		const virtualText = generated.slice(virtualStart, virtualStart + length);
		const originalText = source.slice(originalStart, originalStart + length);

		mappings.push([
			virtualStart,
			length,
			originalStart,
			length,
			virtualText === originalText ? SpanMapKind.Verbatim : SpanMapKind.Atom,
			SpanMapFeature.All,
		]);
	}

	const exportSpan = findComponentExportSpan(generated);
	if (exportSpan) {
		mappings.push([
			exportSpan.start,
			exportSpan.length,
			0,
			0,
			SpanMapKind.Atom,
			EXPORT_ANCHOR_FEATURES,
		]);
	}

	return pruneOverlaps(mappings);
}
