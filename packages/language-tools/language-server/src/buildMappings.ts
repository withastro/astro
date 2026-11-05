import type { Mapping } from '@volar/language-core';
import type { Piece } from 'muggle-string';

type MappedPiece<T> = Exclude<Piece<{ data: T }>, string> & { text: string };
export type CodeSegment<T> = string | MappedPiece<T>;

export function buildMappings<T>(chunks: CodeSegment<T>[]) {
	let length = 0;
	const mappings: Mapping<T>[] = [];
	for (const segment of chunks) {
		if (typeof segment === 'string') {
			length += segment.length;
		} else {
			mappings.push({
				sourceOffsets: [segment.start],
				generatedOffsets: [length],
				lengths: [segment.text.length],
				data: segment.data,
			});
			length += segment.text.length;
		}
	}
	return mappings;
}

export function getText<T>(chunks: CodeSegment<T>[]) {
	return chunks.map((chunk) => (typeof chunk === 'string' ? chunk : chunk.text)).join('');
}
