/*
  NOTE: Do not add any dependencies or imports in this file so that it can load quickly in dev.
*/

// eslint-disable-next-line no-console
const debug = import.meta.env.DEV ? console.debug : undefined;
const inBrowser = import.meta.env.SSR === false;
const prefetchedUrls = new Set<string>();
const listenedAnchors = new WeakSet<HTMLAnchorElement>();

// User-defined config for prefetch
// @ts-expect-error injected by vite-plugin-prefetch
let prefetchAll: boolean = __PREFETCH_PREFETCH_ALL__;
// @ts-expect-error injected by vite-plugin-prefetch
let defaultStrategy: string = __PREFETCH_DEFAULT_STRATEGY__;

interface InitOptions {
	defaultStrategy?: string;
	prefetchAll?: boolean;
}

let inited = false;
/**
 * Initialize the prefetch script, only works once
 */
export function init(opts?: InitOptions) {
	if (!inBrowser) return;

	prefetchAll ??= opts?.prefetchAll ?? false;
	defaultStrategy ??= opts?.defaultStrategy ?? 'hover';

	// Init only once
	if (inited) return;
	inited = true;

	debug?.(`[astro] Initializing prefetch script`);

	// Skip prefetch if prefer data saving
	if ('connection' in navigator) {
		// untyped
		const conn = navigator.connection as any;
		if (conn.saveData || /(2|3)g/.test(conn.effectiveType)) return;
	}

	// In the future, perhaps we can enable treeshaking specific unused strategies
	initTapStrategy();
	initHoverStrategy();
	initViewportStrategy();
}

/**
 * Prefetch links with higher priority when the user taps on them
 */
function initTapStrategy() {
	for (const event of ['touchstart', 'mousedown']) {
		document.body.addEventListener(
			event,
			(e) => {
				if (elMatchesStrategy(e.target, 'tap')) {
					prefetch(e.target.href, { with: 'fetch' });
				}
			},
			{ passive: true, once: true }
		);
	}
}

/**
 * Prefetch links with higher priority when the user hovers over them
 */
function initHoverStrategy() {
	let timeout: number;

	// Handle focus listeners
	document.body.addEventListener(
		'focusin',
		(e) => {
			if (elMatchesStrategy(e.target, 'hover')) {
				handleHoverIn(e);
			}
		},
		{ passive: true }
	);
	document.body.addEventListener('focusout', handleHoverOut, { passive: true });

	// Handle hover listeners. Re-run each time on page load.
	onPageLoad(() => {
		for (const anchor of document.getElementsByTagName('a')) {
			// Skip if already listening
			if (listenedAnchors.has(anchor)) continue;
			// Add listeners for anchors matching the strategy
			if (elMatchesStrategy(anchor, 'hover')) {
				listenedAnchors.add(anchor);
				anchor.addEventListener('mouseenter', handleHoverIn, { passive: true });
				anchor.addEventListener('mouseleave', handleHoverOut, { passive: true });
			}
		}
	});

	function handleHoverIn(e: Event) {
		const href = (e.target as HTMLAnchorElement).href;

		// Debounce hover prefetches by 80ms
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			prefetch(href, { with: 'fetch' });
		}, 80) as unknown as number;
	}

	// Cancel prefetch if the user hovers away
	function handleHoverOut() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = 0;
		}
	}
}

/**
 * Prefetch links with lower priority as they enter the viewport
 */
function initViewportStrategy() {
	let observer: IntersectionObserver;
	const timeouts = new WeakMap<HTMLAnchorElement, number>();

	onPageLoad(() => {
		observer ??= new IntersectionObserver((entries) => {
			for (const entry of entries) {
				const anchor = entry.target as HTMLAnchorElement;
				const timeout = timeouts.get(anchor);
				// Prefetch if intersecting
				if (entry.isIntersecting) {
					// Debounce viewport prefetches by 300ms
					if (timeout) {
						clearTimeout(timeout);
					}
					timeouts.set(
						anchor,
						setTimeout(() => {
							observer.unobserve(anchor);
							prefetch(anchor.href, { with: 'link' });
						}, 300) as unknown as number
					);
				} else {
					if (timeout) {
						clearTimeout(timeout);
						timeouts.delete(anchor);
					}
				}
			}
		});

		for (const anchor of document.getElementsByTagName('a')) {
			// Skip if already listening
			if (listenedAnchors.has(anchor)) continue;
			// Observe for anchors matching the strategy
			if (elMatchesStrategy(anchor, 'viewport')) {
				listenedAnchors.add(anchor);
				observer.observe(anchor);
			}
		}
	});
}

export interface PrefetchOptions {
	/**
	 * How the prefetch should prioritize the URL. (default `'link'`)
	 * - `'link'`: use `<link rel="prefetch">`, has lower loading priority.
	 * - `'fetch'`: use `fetch()`, has higher loading priority.
	 */
	with?: 'link' | 'fetch';
}

/**
 * @param url a full URL string to prefetch
 */
export function prefetch(url: string, opts?: PrefetchOptions) {
	if (!canPrefetchUrl(url)) return;
	prefetchedUrls.add(url);

	const priority = opts?.with ?? 'link';
	debug?.(`[astro] Prefetching ${url} with ${priority}`);

	if (priority === 'link') {
		const link = document.createElement('link');
		link.rel = 'prefetch';
		link.setAttribute('href', url);
		document.head.append(link);
	} else {
		fetch(url).catch((e) => {
			// eslint-disable-next-line no-console
			console.log(`[astro] Failed to prefetch ${url}`);
			// eslint-disable-next-line no-console
			console.error(e);
		});
	}
}

function canPrefetchUrl(url: string) {
	if (!navigator.onLine) return false;
	try {
		const urlObj = new URL(url);
		return (
			location.origin === urlObj.origin &&
			location.pathname !== urlObj.pathname &&
			!prefetchedUrls.has(url)
		);
	} catch {}
	return false;
}

function elMatchesStrategy(el: EventTarget | null, strategy: string): el is HTMLAnchorElement {
	// @ts-expect-error access unknown property this way as it's more performant
	if (el?.tagName !== 'A') return false;
	const attrValue = (el as HTMLElement).dataset.astroPrefetch;

	// Out-out if `prefetchAll` is enabled
	if (attrValue === 'false') {
		return false;
	}
	// If anchor has no dataset but we want to prefetch all, or has dataset but no value,
	// check against fallback default strategy
	if ((attrValue == null && prefetchAll) || attrValue === '') {
		return strategy === defaultStrategy;
	}
	// Else if dataset is explicitly defined, check against it
	if (attrValue === strategy) {
		return true;
	}
	// Else, no match
	return false;
}

/**
 * Listen to page loads and handle Astro's View Transition specific events
 */
function onPageLoad(cb: () => void) {
	cb();
	// Ignore first call of `astro-page-load` as we already call `cb` above.
	// We have to call `cb` eagerly as View Transitions may not be enabled.
	let firstLoad = false;
	document.addEventListener('astro:page-load', () => {
		if (!firstLoad) {
			firstLoad = true;
			return;
		}
		cb();
	});
}
