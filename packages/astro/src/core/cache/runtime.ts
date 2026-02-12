import type {
	CacheHint,
	CacheOptions,
	CacheProvider,
	InvalidateOptions,
	LiveDataEntry,
} from './types.js';
import { defaultSetHeaders, isLiveDataEntry } from './utils.js';

export class AstroCache {
	#options: CacheOptions = {};
	#tags: Set<string> = new Set();
	#disabled = false;
	#provider: CacheProvider | null;

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

	async invalidate(input: InvalidateOptions | LiveDataEntry): Promise<void> {
		if (!this.#provider) {
			throw new Error('Cache invalidation requires a cache provider');
		}
		let options: InvalidateOptions;
		if (isLiveDataEntry(input)) {
			options = { tags: input.cacheHint?.tags ?? [] };
		} else {
			options = input;
		}
		return this.#provider.invalidate(options);
	}

	/** Called by the framework after rendering to apply headers */
	_applyHeaders(response: Response): void {
		if (this.#disabled) return;
		const finalOptions: CacheOptions = { ...this.#options, tags: this.tags };
		if (finalOptions.maxAge === undefined && !finalOptions.tags?.length) return;

		const headers = this.#provider?.setHeaders?.(finalOptions) ?? defaultSetHeaders(finalOptions);
		for (const [key, value] of headers) {
			response.headers.set(key, value);
		}
	}

	get _isActive(): boolean {
		return !this.#disabled && (this.#options.maxAge !== undefined || this.#tags.size > 0);
	}
}
