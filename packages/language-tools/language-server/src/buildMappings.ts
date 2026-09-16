import type { Mapping } from '@volar/language-core';
import type { Segment } from 'muggle-string';

export function buildMappings<T>(chunks: Segment<T>[]) {
	let length = 0;
	const mappings: Mapping<T>[] = [];
	for (const segment of chunks) {
		if (typeof segment === 'string') {
			length += segment.length;
		} else {
			mappings.push({
				sourceOffsets: [segment[2]],
				generatedOffsets: [length],
				lengths: [segment[0].length],
				data: segment[3]!,
			});
			length += segment[0].length;
		}
	}
	return mappings;
}
