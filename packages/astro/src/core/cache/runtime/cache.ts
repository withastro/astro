import type {
	CacheHint,
	CacheOptions,
	CacheProvider,
	InvalidateOptions,
	LiveDataEntry,
} from '../types.js';
import { AstroError } from '../../errors/errors.js';
import { CacheNotEnabled } from '../../errors/errors-data.js';
import { defaultSetHeaders, isLiveDataEntry } from './utils.js';

const APPLY_HEADERS = Symbol.for('astro:cache:apply');
const IS_ACTIVE = Symbol.for('astro:cache:active');

export interface CacheLike {
	/**
	 * Whether caching is enabled. `false` when no cache provider is configured
	 * or in dev mode. Libraries can check this before calling cache methods.
	 */
	readonly enabled: boolean;
	/**
	 * Set cache options for the current request. Call multiple times to merge options.
	 * Pass `false` to explicitly opt out of caching.
	 */
	set(input: CacheOptions | CacheHint | LiveDataEntry | false): void;
	/** All accumulated cache tags for this request. */
	readonly tags: string[];
	/** A read-only snapshot of the current cache options, including accumulated tags. */
	readonly options: Readonly<CacheOptions>;
	/**
	 * Purge cached entries by tag or path. Requires a cache provider to be configured.
	 */
	invalidate(input: InvalidateOptions | LiveDataEntry): Promise<void>;
}

export class AstroCache implements CacheLike {
	#options: CacheOptions = {};
	#tags = new Set<string>();
	#disabled = false;
	#provider: CacheProvider | null;

	readonly enabled = true;

	constructor(provider: CacheProvider | null) {
		this.#provider = provider;
	}

	set(input: CacheOptions | CacheHint | LiveDataEntry | false): void {
		if (input === false) {
			this.#disabled = true;
			this.#tags.clear();
			this.#options = {};
			return;
		}
		this.#disabled = false;

		// Extract CacheHint from LiveDataEntry
		let options: CacheOptions | CacheHint;
		if (isLiveDataEntry(input)) {
			if (!input.cacheHint) return;
			options = input.cacheHint;
		} else {
			options = input;
		}

		// Merge scalars: last-write-wins
		if ('maxAge' in options && options.maxAge !== undefined) this.#options.maxAge = options.maxAge;
		if ('swr' in options && (options as CacheOptions).swr !== undefined)
			this.#options.swr = (options as CacheOptions).swr;
		if ('etag' in options && (options as CacheOptions).etag !== undefined)
			this.#options.etag = (options as CacheOptions).etag;

		// lastModified: most recent wins
		if (options.lastModified !== undefined) {
			if (!this.#options.lastModified || options.lastModified > this.#options.lastModified) {
				this.#options.lastModified = options.lastModified;
			}
		}

		// Tags: accumulate
		if (options.tags) {
			for (const tag of options.tags) this.#tags.add(tag);
		}
	}

	get tags(): string[] {
		return [...this.#tags];
	}

	/**
	 * Get the current cache options (read-only snapshot).
	 * Includes all accumulated options: maxAge, swr, tags, etag, lastModified.
	 */
	get options(): Readonly<CacheOptions> {
		return {
			...this.#options,
			tags: this.tags,
		};
	}

	async invalidate(input: InvalidateOptions | LiveDataEntry): Promise<void> {
		if (!this.#provider) {
			throw new AstroError(CacheNotEnabled);
		}
		let options: InvalidateOptions;
		if (isLiveDataEntry(input)) {
			options = { tags: input.cacheHint?.tags ?? [] };
		} else {
			options = input;
		}
		return this.#provider.invalidate(options);
	}

	/** @internal */
	[APPLY_HEADERS](response: Response): void {
		if (this.#disabled) return;
		const finalOptions: CacheOptions = { ...this.#options, tags: this.tags };
		if (finalOptions.maxAge === undefined && !finalOptions.tags?.length) return;

		const headers = this.#provider?.setHeaders?.(finalOptions) ?? defaultSetHeaders(finalOptions);
		for (const [key, value] of headers) {
			response.headers.set(key, value);
		}
	}

	/** @internal */
	get [IS_ACTIVE](): boolean {
		return !this.#disabled && (this.#options.maxAge !== undefined || this.#tags.size > 0);
	}
}

// ─── Framework-internal helpers (not exported from the `astro` package) ─────

/**
 * Apply cache headers to a response.
 */
export function applyCacheHeaders(cache: CacheLike, response: Response): void {
	if (APPLY_HEADERS in cache) {
		(cache as AstroCache)[APPLY_HEADERS](response);
	}
}

/**
 * Check whether the cache has any active state worth acting on.
 */
export function isCacheActive(cache: CacheLike): boolean {
	if (IS_ACTIVE in cache) {
		return (cache as AstroCache)[IS_ACTIVE];
	}
	return false;
}
