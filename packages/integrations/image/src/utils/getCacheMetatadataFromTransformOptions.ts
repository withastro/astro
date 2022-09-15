import type { TransformOptions } from '../loaders';

export function getCacheMetatadataFromTransformOptions(
	transform: TransformOptions
	// TODO(ALAN): Can we TS type the "rest" param and make sure it's everything
	// that Sharp takes as input?
): Omit<TransformOptions, 'src' | 'alt'> {
	// Ditch the src and alt. It isn't relevant where we got the input buffer from
	// because we hash it anyway. The alt tag is also inconsequential to the
	// tranform. The same transform applied to the same buffer from two different
	// sources produces the same output buffer.
	const {
		src,
		// TODO(ALAN) this isn't in the TS type but it is on the object. Find and fix this.
		// @ts-ignore
		alt,
		...cacheRelevantTransformMetadata
	} = transform;

	return cacheRelevantTransformMetadata;
}
