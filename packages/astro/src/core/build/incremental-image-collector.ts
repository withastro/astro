import type { SerializedStaticImage } from '../../assets/types.js';

/**
 * Side-channel used to attribute optimized-image transforms to the path being
 * generated. Transforms are registered globally and deduplicated across pages
 * (`globalThis.astroAsset.staticImages`), so a snapshot diff cannot tell which
 * page referenced a shared transform. Instead `addStaticImage` reports every
 * transform it resolves (dedup hits included) to the open collection.
 *
 * `generate.ts` opens a collection around each path render and stores the
 * collected transforms in the path's incremental cache entry. On a later build,
 * a skipped path replays them so the asset pipeline still emits its images even
 * though the page was never rendered. Like the content-entry collector, this
 * lives on a `Symbol.for` global so the build orchestrator and the bundled
 * asset plugin resolve the same instance.
 */
const COLLECTOR_KEY = Symbol.for('astro:incremental-static-images');

interface Collector {
	current: SerializedStaticImage[] | undefined;
}

interface CollectorGlobal {
	[COLLECTOR_KEY]?: Collector;
}

/**
 * Returns the process-wide collector, installing it on first access. The
 * binding is sealed (`configurable: false`, `writable: false`) so neither our
 * own modules nor user code sharing `globalThis` during the build can replace
 * or delete the side-channel. Only its `current` field is mutated, by the
 * begin/end pair below.
 */
function collector(): Collector {
	const host = globalThis as unknown as CollectorGlobal;
	let value = host[COLLECTOR_KEY];
	if (!value) {
		value = { current: undefined };
		Object.defineProperty(host, COLLECTOR_KEY, {
			value,
			configurable: false,
			writable: false,
			enumerable: false,
		});
	}
	return value;
}

/** Start collecting the image transforms resolved on the current path. */
export function beginImageCollection(): void {
	collector().current = [];
}

/** Record an image transform resolved while rendering the current path. */
export function recordStaticImage(image: SerializedStaticImage): void {
	collector().current?.push(image);
}

/**
 * Finish collection and return the collected transforms, or `undefined` when no
 * collection was active (so callers can distinguish "no images" from
 * "not tracked").
 */
export function endImageCollection(): SerializedStaticImage[] | undefined {
	const c = collector();
	const images = c.current;
	c.current = undefined;
	return images;
}
