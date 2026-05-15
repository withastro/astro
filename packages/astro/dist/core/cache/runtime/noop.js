import { AstroError } from '../../errors/errors.js';
import { CacheNotEnabled } from '../../errors/errors-data.js';
const EMPTY_OPTIONS = Object.freeze({ tags: [] });
class NoopAstroCache {
	enabled = false;
	set() {}
	get tags() {
		return [];
	}
	get options() {
		return EMPTY_OPTIONS;
	}
	async invalidate() {}
}
let hasWarned = false;
class DisabledAstroCache {
	enabled = false;
	#logger;
	constructor(logger) {
		this.#logger = logger;
	}
	#warn() {
		if (!hasWarned) {
			hasWarned = true;
			this.#logger?.warn(
				'cache',
				'`cache.set()` was called but caching is not enabled. Configure a cache provider in your Astro config under `experimental.cache` to enable caching.',
			);
		}
	}
	set() {
		this.#warn();
	}
	get tags() {
		return [];
	}
	get options() {
		return EMPTY_OPTIONS;
	}
	async invalidate() {
		throw new AstroError(CacheNotEnabled);
	}
}
export { DisabledAstroCache, NoopAstroCache };
