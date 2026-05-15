interface InitOptions {
	defaultStrategy?: string;
	prefetchAll?: boolean;
}
/**
 * Initialize the prefetch script, only works once.
 *
 * @param defaultOpts Default options for prefetching if not already set by the user config.
 */
export declare function init(defaultOpts?: InitOptions): void;
export interface PrefetchOptions {
	/**
	 * Should prefetch even on data saver mode or slow connection. (default `false`)
	 */
	ignoreSlowConnection?: boolean;
	/**
	 * A string providing a hint to the browser as to how eagerly it should prefetch/prerender link targets in order to balance performance advantages against resource overheads. (default `immediate`)
	 * Only works if `clientPrerender` is enabled and browser supports Speculation Rules API.
	 * The browser takes this hint into consideration along with its own heuristics, so it may select a link that the author has hinted as less eager than another, if the less eager candidate is considered a better choice.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/speculationrules#eagerness
	 */
	eagerness?: 'immediate' | 'eager' | 'moderate' | 'conservative';
}
/**
 * Prefetch a URL so it's cached when the user navigates to it.
 *
 * @param url A full or partial URL string based on the current `location.href`. They are only fetched if:
 *   - The user is online
 *   - The user is not in data saver mode
 *   - The URL is within the same origin
 *   - The URL is not the current page
 *   - The URL has not already been prefetched
 * @param opts Additional options for prefetching.
 */
export declare function prefetch(url: string, opts?: PrefetchOptions): void;
export {};
