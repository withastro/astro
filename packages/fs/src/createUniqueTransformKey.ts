import { hash } from './hash.js';

export function createUniqueTransformKey(
	input: Buffer,
	transformMetadata: Record<string, unknown>
): string {
	// stringify with sorted keys so that
	//   { width: 1, height: 1 }
	// has the same result as
	//   { height: 1, width: 1 }
	const normalizedTransform = JSON.stringify(
		transformMetadata,
		Object.keys(transformMetadata).sort()
	);

	// Combine the buffer hash and the transform metadata to create a unique key
	return JSON.stringify({
		bufferHash: hash(input),
		normalizedTransform,
	});
}
