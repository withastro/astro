import { AstroError } from '../../errors/errors.js';
import { CacheNotEnabled } from '../../errors/errors-data.js';
import { defaultSetHeaders, isLiveDataEntry } from './utils.js';
const APPLY_HEADERS = /* @__PURE__ */ Symbol.for('astro:cache:apply');
const IS_ACTIVE = /* @__PURE__ */ Symbol.for('astro:cache:active');
class AstroCache {
	#options = {};
	#tags = /* @__PURE__ */ new Set();
	#disabled = false;
	#provider;
	enabled = true;
	constructor(provider) {
		this.#provider = provider;
	}
	set(input) {
		if (input === false) {
			this.#disabled = true;
			this.#tags.clear();
			this.#options = {};
			return;
		}
		this.#disabled = false;
		let options;
		if (isLiveDataEntry(input)) {
			if (!input.cacheHint) return;
			options = input.cacheHint;
		} else {
			options = input;
		}
		if ('maxAge' in options && options.maxAge !== void 0) this.#options.maxAge = options.maxAge;
		if ('swr' in options && options.swr !== void 0) this.#options.swr = options.swr;
		if ('etag' in options && options.etag !== void 0) this.#options.etag = options.etag;
		if (options.lastModified !== void 0) {
			if (!this.#options.lastModified || options.lastModified > this.#options.lastModified) {
				this.#options.lastModified = options.lastModified;
			}
		}
		if (options.tags) {
			for (const tag of options.tags) this.#tags.add(tag);
		}
	}
	get tags() {
		return [...this.#tags];
	}
	/**
	 * Get the current cache options (read-only snapshot).
	 * Includes all accumulated options: maxAge, swr, tags, etag, lastModified.
	 */
	get options() {
		return {
			...this.#options,
			tags: this.tags,
		};
	}
	async invalidate(input) {
		if (!this.#provider) {
			throw new AstroError(CacheNotEnabled);
		}
		let options;
		if (isLiveDataEntry(input)) {
			options = { tags: input.cacheHint?.tags ?? [] };
		} else {
			options = input;
		}
		return this.#provider.invalidate(options);
	}
	/** @internal */
	[APPLY_HEADERS](response) {
		if (this.#disabled) return;
		const finalOptions = { ...this.#options, tags: this.tags };
		if (finalOptions.maxAge === void 0 && !finalOptions.tags?.length) return;
		const headers = this.#provider?.setHeaders?.(finalOptions) ?? defaultSetHeaders(finalOptions);
		for (const [key, value] of headers) {
			response.headers.set(key, value);
		}
	}
	/** @internal */
	get [IS_ACTIVE]() {
		return !this.#disabled && (this.#options.maxAge !== void 0 || this.#tags.size > 0);
	}
}
function applyCacheHeaders(cache, response) {
	if (APPLY_HEADERS in cache) {
		cache[APPLY_HEADERS](response);
	}
}
function isCacheActive(cache) {
	if (IS_ACTIVE in cache) {
		return cache[IS_ACTIVE];
	}
	return false;
}
export { AstroCache, applyCacheHeaders, isCacheActive };
