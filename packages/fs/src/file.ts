import { Cache } from './Cache.js';
import { createUniqueTransformKey } from './createUniqueTransformKey.js';

type TTransformResult<TMetadata> = { output: Buffer; metadata: TMetadata };
type TTransformFn<TMetadata> = () => Promise<TTransformResult<TMetadata>>;
type TransformOptions<TMetadata> = {
	/**
	 * The input buffer to be transformed
	 */
	input: Buffer;
	/**
	 * Any data that uniquely identifies the transform operation. This should
	 * always deterministically produce the same output:
	 *
	 *   transformFn(input, transformMetadata) => output
	 */
	transformMetadata: Record<string, unknown>;
	/**
	 * A callback function that generates the data when it doesn't exist. The
	 * result of this will be cached for future calls.
	 */
	transformFn: TTransformFn<TMetadata>;
	/**
	 * Enable file system cache or not
	 */
	enableCache: boolean;
};

export async function transformBuffer<TMetadata>({
	input,
	transformMetadata,
	transformFn,
	enableCache,
}: TransformOptions<TMetadata>): Promise<TTransformResult<TMetadata> & { wasCacheUsed: boolean }> {
	// TODO(ALAN) Have to consider cache limit. LRU with either byte or file count
	// limit?

	const cacheKey = enableCache && createUniqueTransformKey(input, transformMetadata);
	let result: TTransformResult<TMetadata> | undefined = undefined;
	let wasCacheUsed = false;

	try {
		if (cacheKey) {
			const { data, metadata } = await Cache.get(cacheKey);
			if (metadata != null) {
				result = { output: data, metadata };
				wasCacheUsed = true;
			}
		}
	} catch (e) {}

	if (result == null) {
		result = await transformFn();
		if (cacheKey) {
			const { output: data, metadata } = result;
			await Cache.put(cacheKey, data, {
				metadata,
			});
		}
	}

	// console.log(
	// 	`file#transformBuffer() => cache hit=${wasCacheUsed ? 'yes' : 'no'} / cacheKey=${cacheKey}`
	// );

	return { ...result, wasCacheUsed };
}
