import { internalFetchHeaders } from 'virtual:astro:adapter-config/client';
const debug = import.meta.env.DEV ? console.debug : void 0;
const inBrowser = import.meta.env.SSR === false;
const prefetchedUrls = /* @__PURE__ */ new Set();
const listenedAnchors = /* @__PURE__ */ new WeakSet();
let prefetchAll = __PREFETCH_PREFETCH_ALL__;
let defaultStrategy = __PREFETCH_DEFAULT_STRATEGY__;
let clientPrerender = __EXPERIMENTAL_CLIENT_PRERENDER__;
let inited = false;
function init(defaultOpts) {
	if (!inBrowser) return;
	if (inited) return;
	inited = true;
	debug?.(`[astro] Initializing prefetch script`);
	prefetchAll ??= defaultOpts?.prefetchAll ?? false;
	defaultStrategy ??= defaultOpts?.defaultStrategy ?? 'hover';
	initTapStrategy();
	initHoverStrategy();
	initViewportStrategy();
	initLoadStrategy();
}
function initTapStrategy() {
	for (const event of ['touchstart', 'mousedown']) {
		document.addEventListener(
			event,
			(e) => {
				const anchor = e.target.closest('a');
				if (elMatchesStrategy(anchor, 'tap')) {
					prefetch(anchor.href, { ignoreSlowConnection: true });
				}
			},
			{ passive: true },
		);
	}
}
function initHoverStrategy() {
	let timeout;
	document.body.addEventListener(
		'focusin',
		(e) => {
			const anchor = e.target.closest('a');
			if (elMatchesStrategy(anchor, 'hover')) {
				handleHoverIn(anchor.href);
			}
		},
		{ passive: true },
	);
	document.body.addEventListener('focusout', handleHoverOut, { passive: true });
	onPageLoad(() => {
		for (const anchor of document.getElementsByTagName('a')) {
			if (listenedAnchors.has(anchor)) continue;
			if (elMatchesStrategy(anchor, 'hover')) {
				listenedAnchors.add(anchor);
				anchor.addEventListener('mouseenter', (e) => handleHoverIn(e.currentTarget.href), {
					passive: true,
				});
				anchor.addEventListener('mouseleave', handleHoverOut, { passive: true });
			}
		}
	});
	function handleHoverIn(href) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			prefetch(href);
		}, 80);
	}
	function handleHoverOut() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = 0;
		}
	}
}
function initViewportStrategy() {
	let observer;
	onPageLoad(() => {
		for (const anchor of document.getElementsByTagName('a')) {
			if (listenedAnchors.has(anchor)) continue;
			if (elMatchesStrategy(anchor, 'viewport')) {
				listenedAnchors.add(anchor);
				observer ??= createViewportIntersectionObserver();
				observer.observe(anchor);
			}
		}
	});
}
function createViewportIntersectionObserver() {
	const timeouts = /* @__PURE__ */ new WeakMap();
	return new IntersectionObserver((entries, observer) => {
		for (const entry of entries) {
			const anchor = entry.target;
			const timeout = timeouts.get(anchor);
			if (entry.isIntersecting) {
				if (timeout) {
					clearTimeout(timeout);
				}
				timeouts.set(
					anchor,
					setTimeout(() => {
						observer.unobserve(anchor);
						timeouts.delete(anchor);
						prefetch(anchor.href);
					}, 300),
				);
			} else {
				if (timeout) {
					clearTimeout(timeout);
					timeouts.delete(anchor);
				}
			}
		}
	});
}
function initLoadStrategy() {
	onPageLoad(() => {
		for (const anchor of document.getElementsByTagName('a')) {
			if (elMatchesStrategy(anchor, 'load')) {
				prefetch(anchor.href);
			}
		}
	});
}
function prefetch(url, opts) {
	url = url.replace(/#.*/, '');
	const ignoreSlowConnection = opts?.ignoreSlowConnection ?? false;
	if (!canPrefetchUrl(url, ignoreSlowConnection)) return;
	prefetchedUrls.add(url);
	if (clientPrerender && HTMLScriptElement.supports?.('speculationrules')) {
		debug?.(`[astro] Prefetching ${url} with <script type="speculationrules">`);
		appendSpeculationRules(url, opts?.eagerness ?? 'immediate');
	} else if (document.createElement('link').relList?.supports?.('prefetch')) {
		debug?.(`[astro] Prefetching ${url} with <link rel="prefetch">`);
		const link = document.createElement('link');
		link.rel = 'prefetch';
		link.setAttribute('href', url);
		document.head.append(link);
	} else {
		debug?.(`[astro] Prefetching ${url} with fetch`);
		const headers = new Headers();
		for (const [key, value] of Object.entries(internalFetchHeaders)) {
			headers.set(key, value);
		}
		fetch(url, { priority: 'low', headers });
	}
}
function canPrefetchUrl(url, ignoreSlowConnection) {
	if (!navigator.onLine) return false;
	if (!ignoreSlowConnection && isSlowConnection()) return false;
	try {
		const urlObj = new URL(url, location.href);
		return (
			location.origin === urlObj.origin &&
			(location.pathname !== urlObj.pathname || location.search !== urlObj.search) &&
			!prefetchedUrls.has(url)
		);
	} catch {}
	return false;
}
function elMatchesStrategy(el, strategy) {
	if (el?.tagName !== 'A') return false;
	const attrValue = el.dataset.astroPrefetch;
	if (attrValue === 'false') {
		return false;
	}
	if (strategy === 'tap' && (attrValue != null || prefetchAll) && isSlowConnection()) {
		return true;
	}
	if ((attrValue == null && prefetchAll) || attrValue === '') {
		return strategy === defaultStrategy;
	}
	if (attrValue === strategy) {
		return true;
	}
	return false;
}
function isSlowConnection() {
	if ('connection' in navigator) {
		const conn = navigator.connection;
		return conn.saveData || /2g/.test(conn.effectiveType);
	}
	return false;
}
function onPageLoad(cb) {
	cb();
	let firstLoad = false;
	document.addEventListener('astro:page-load', () => {
		if (!firstLoad) {
			firstLoad = true;
			return;
		}
		cb();
	});
}
function appendSpeculationRules(url, eagerness) {
	const script = document.createElement('script');
	script.type = 'speculationrules';
	script.textContent = JSON.stringify({
		prerender: [
			{
				source: 'list',
				urls: [url],
				eagerness,
			},
		],
		// Currently, adding `prefetch` is required to fallback if `prerender` fails.
		// Possibly will be automatic in the future, in which case it can be removed.
		// https://github.com/WICG/nav-speculation/issues/162#issuecomment-1977818473
		prefetch: [
			{
				source: 'list',
				urls: [url],
				eagerness,
			},
		],
	});
	document.head.append(script);
}
export { init, prefetch };
