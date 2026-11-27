/** Above this approximate size, the props of a route's paths are considered too large. */
export const LARGE_PROPS_LENGTH = 256 * 1024 * 1024;

/**
 * Approximates how large `value` would be if it were copied, as a number of
 * characters. Sizes of objects are cached in `sizes`, so data shared between
 * paths is counted for each path but only walked once.
 */
export function getPropsLength(value: unknown, sizes: WeakMap<object, number>): number {
	switch (typeof value) {
		case 'string':
			return value.length;
		case 'object':
			break;
		case 'function':
		case 'symbol':
			return 0;
		default:
			return 8;
	}
	if (value === null) return 4;

	const cached = sizes.get(value);
	if (cached !== undefined) return cached;
	// Cycles are counted once.
	sizes.set(value, 0);

	let length = 2;
	if (value instanceof Map) {
		for (const [key, item] of value)
			length += getPropsLength(key, sizes) + getPropsLength(item, sizes);
	} else if (Array.isArray(value) || value instanceof Set) {
		for (const item of value) length += getPropsLength(item, sizes) + 1;
	} else {
		for (const key in value) {
			length += key.length + getPropsLength((value as Record<string, unknown>)[key], sizes) + 2;
		}
	}
	sizes.set(value, length);
	return length;
}

const SAMPLED_PATHS = 100;

/**
 * Whether the props of `paths` add up to more than `limit`. Only up to 100
 * evenly spaced paths are measured, and the total is extrapolated from them.
 */
export function hasLargeProps(
	paths: ReadonlyArray<{ props?: unknown }>,
	limit = LARGE_PROPS_LENGTH,
): boolean {
	if (paths.length === 0) return false;
	const samples = Math.min(paths.length, SAMPLED_PATHS);
	const step = paths.length / samples;
	// Every sampled path stands for `step` paths. Stop as soon as the total is over the limit.
	const limitPerSample = limit / step;
	const sizes = new WeakMap<object, number>();
	let length = 0;
	for (let i = 0; i < samples; i++) {
		length += getPropsLength(paths[Math.floor(i * step)].props, sizes);
		if (length > limitPerSample) return true;
	}
	return false;
}
