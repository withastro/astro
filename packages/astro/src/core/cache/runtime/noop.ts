import { AstroError } from '../../errors/errors.js';
import { CacheNotEnabled } from '../../errors/errors-data.js';
import type { CacheLike } from './cache.js';
import type { CacheOptions } from '../types.js';
import type { Logger } from '../../logger/core.js';

/**
 * A no-op cache implementation used in dev mode when cache is configured.
 * The API is available so user code doesn't need conditional checks,
 * but nothing is actually cached.
 */
const EMPTY_OPTIONS = Object.freeze({ tags: [] }) as Readonly<CacheOptions>;

export class NoopAstroCache implements CacheLike {
	readonly enabled = false;

	set(): void {}

	get tags(): string[] {
		return [];
	}

	get options(): Readonly<CacheOptions> {
		return EMPTY_OPTIONS;
	}

	async invalidate(): Promise<void> {}
}

let hasWarned = false;

/**
 * A no-op cache used when cache is not configured.
 * Logs a warning on first use instead of throwing, so libraries
 * can call cache methods without needing try/catch.
 * `invalidate()` still throws since it implies the caller
 * expects purging to actually work.
 */
export class DisabledAstroCache implements CacheLike {
	readonly enabled = false;
	#logger: Logger | undefined;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	#warn(): void {
		if (!hasWarned) {
			hasWarned = true;
			this.#logger?.warn(
				'cache',
				'`cache.set()` was called but caching is not enabled. Configure a cache provider in your Astro config under `experimental.cache` to enable caching.',
			);
		}
	}

	set(): void {
		this.#warn();
	}

	get tags(): string[] {
		return [];
	}

	get options(): Readonly<CacheOptions> {
		return EMPTY_OPTIONS;
	}

	async invalidate(): Promise<void> {
		throw new AstroError(CacheNotEnabled);
	}
}
