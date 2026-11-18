import type { AuditRuleWithSelector } from './index.js';

// A regular expression to match external URLs
const EXTERNAL_URL_REGEX = /^(?:[a-z+]+:)?\/\//i;

/**
 * Reads the image's size from the resource timing entry of the request that loaded it, waiting for
 * an eager or in-viewport lazy image to finish loading first. Returns 0 when the size is unknown: an
 * off-screen lazy image that hasn't loaded yet, or a browser reporting no size (WebKit does for `loading="lazy"` images).
 *
 * The image is never fetched again: fetching an animated SVG freezes its CSS animations in WebKit,
 * and fetching a lazy image forces a download the page deferred (https://github.com/withastro/astro/issues/18700).
 */
async function getImageSize(image: HTMLImageElement): Promise<number> {
	if (!image.complete) {
		// An off-screen lazy image may not load until the user scrolls to it, and the audit awaits each
		// rule in turn. A lazy image inside the viewport is already being loaded by the browser.
		if (image.loading === 'lazy' && !isInViewport(image)) return 0;
		await new Promise<void>((resolve) => {
			image.addEventListener('load', () => resolve(), { once: true });
			image.addEventListener('error', () => resolve(), { once: true });
		});
	}

	const entries = performance.getEntriesByName(image.currentSrc, 'resource');
	const entry = entries.at(-1) as PerformanceResourceTiming | undefined;
	return entry?.decodedBodySize || entry?.encodedBodySize || entry?.transferSize || 0;
}

function isInViewport(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	return (
		rect.bottom > 0 &&
		rect.right > 0 &&
		rect.top < window.innerHeight &&
		rect.left < window.innerWidth
	);
}

export const perf: AuditRuleWithSelector[] = [
	{
		code: 'perf-use-image-component',
		title: 'Use the Image component',
		message: 'This image could be replaced with the Image component to improve performance.',
		selector: 'img:not([data-image-component])',
		async match(element) {
			// Skip images inside framework components (React, Vue, Svelte, etc.)
			// These are wrapped in astro-island and can't directly use Astro's Image component
			if (element.closest('astro-island')) return false;

			const src = element.getAttribute('src');
			if (!src) return false;

			// Don't match data URIs, they're typically used for specific use-cases that the image component doesn't help with
			if (src.startsWith('data:')) return false;

			// Ignore images that are smaller than 20KB, most of the time the image component won't really help with these, or they're used for specific use-cases (pixel tracking, etc.)
			// Ignore this test for remote images for now, fetching them can be very slow and possibly dangerous
			if (!EXTERNAL_URL_REGEX.test(src)) {
				if ((await getImageSize(element as HTMLImageElement)) < 20480) return false;
			}

			return true;
		},
	},
	{
		code: 'perf-use-loading-lazy',
		title: 'Unoptimized loading attribute',
		message: (element) =>
			`This ${element.nodeName} tag is below the fold and could be lazy-loaded to improve performance.`,
		selector:
			'img:not([loading]), img[loading="eager"], iframe:not([loading]), iframe[loading="eager"]',
		match(element) {
			const htmlElement = element as HTMLImageElement | HTMLIFrameElement;

			// Ignore elements that are above the fold, they should be loaded eagerly
			let currentElement = element as HTMLElement;
			let elementYPosition = 0;
			while (currentElement) {
				elementYPosition += currentElement.offsetTop;
				currentElement = currentElement.offsetParent as HTMLElement;
			}
			if (elementYPosition < window.innerHeight) return false;

			// Ignore elements using `data:` URI, the `loading` attribute doesn't do anything for these
			if (htmlElement.src.startsWith('data:')) return false;

			return true;
		},
	},
	{
		code: 'perf-use-loading-eager',
		title: 'Unoptimized loading attribute',
		message: (element) =>
			`This ${element.nodeName} tag is above the fold and could be eagerly-loaded to improve performance.`,
		selector: 'img[loading="lazy"], iframe[loading="lazy"]',
		match(element) {
			const htmlElement = element as HTMLImageElement | HTMLIFrameElement;

			// Ignore elements that are below the fold, they should be loaded lazily
			let currentElement = element as HTMLElement;
			let elementYPosition = 0;
			while (currentElement) {
				elementYPosition += currentElement.offsetTop;
				currentElement = currentElement.offsetParent as HTMLElement;
			}
			if (elementYPosition > window.innerHeight) return false;

			// Ignore elements using `data:` URI, the `loading` attribute doesn't do anything for these
			if (htmlElement.src.startsWith('data:')) return false;

			return true;
		},
	},
	{
		code: 'perf-use-videos',
		title: 'Use videos instead of GIFs for large animations',
		message:
			'This GIF could be replaced with a video to reduce its file size and improve performance.',
		selector: 'img[src$=".gif"]',
		async match(element) {
			const src = element.getAttribute('src');
			if (!src) return false;

			// Ignore remote URLs
			if (EXTERNAL_URL_REGEX.test(src)) return false;

			// Ignore GIFs that are smaller than 100KB, those are typically small enough to not be a problem
			if (!EXTERNAL_URL_REGEX.test(src)) {
				if ((await getImageSize(element as HTMLImageElement)) < 102400) return false;
			}

			return true;
		},
	},
	{
		code: 'perf-slow-component-server-render',
		title: 'Server-rendered component took a long time to render',
		message: (element) =>
			`This component took an unusually long time to render on the server (${getCleanRenderingTime(
				element.getAttribute('server-render-time'),
			)}). This might be a sign that it's doing too much work on the server, or something is blocking rendering.`,
		selector: 'astro-island[server-render-time]',
		match(element) {
			const serverRenderTime = element.getAttribute('server-render-time');
			if (!serverRenderTime) return false;

			const renderingTime = Number.parseFloat(serverRenderTime);
			if (Number.isNaN(renderingTime)) return false;

			return renderingTime > 500;
		},
	},
	{
		code: 'perf-slow-component-client-hydration',
		title: 'Client-rendered component took a long time to hydrate',
		message: (element) =>
			`This component took an unusually long time to render on the server (${getCleanRenderingTime(
				element.getAttribute('client-render-time'),
			)}). This could be a sign that something is blocking the main thread and preventing the component from hydrating quickly.`,
		selector: 'astro-island[client-render-time]',
		match(element) {
			const clientRenderTime = element.getAttribute('client-render-time');
			if (!clientRenderTime) return false;

			const renderingTime = Number.parseFloat(clientRenderTime);
			if (Number.isNaN(renderingTime)) return false;

			return renderingTime > 500;
		},
	},
];

function getCleanRenderingTime(time: string | null) {
	if (!time) return 'unknown';
	const renderingTime = Number.parseFloat(time);
	if (Number.isNaN(renderingTime)) return 'unknown';

	return renderingTime.toFixed(2) + 's';
}
