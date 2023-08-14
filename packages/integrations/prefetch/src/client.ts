/// <reference types="../@types/network-information.d.ts" />
import throttles from 'throttles';
import requestIdleCallback from './requestIdleCallback.js';

const events = ['mouseenter', 'touchstart', 'focus'];

const preloaded = new Set<string>();
const loadedStyles = new Set<string>();

function shouldPreload({ href }: { href: string }) {
	try {
		const url = new URL(href);
		return (
			window.location.origin === url.origin &&
			window.location.pathname !== url.pathname &&
			!preloaded.has(href)
		);
	} catch {}

	return false;
}

let parser: DOMParser;
let observer: IntersectionObserver;

function observe(link: HTMLAnchorElement) {
	preloaded.add(link.href);
	observer.observe(link);
	events.map((event) => link.addEventListener(event, onLinkEvent, { passive: true, once: true }));
}

function unobserve(link: HTMLAnchorElement) {
	observer.unobserve(link);
	events.map((event) => link.removeEventListener(event, onLinkEvent));
}

function onLinkEvent({ target }: Event) {
	if (!(target instanceof HTMLAnchorElement)) {
		return;
	}

	preloadHref(target);
}

async function preloadHref(link: HTMLAnchorElement) {
	unobserve(link);
	const { href } = link;

	try {
		const contents = await fetch(href).then((res) => res.text());
		parser ||= new DOMParser();

		const html = parser.parseFromString(contents, 'text/html');
		const styles = Array.from(html.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));

		await Promise.all(
			styles
				.filter((el) => !loadedStyles.has(el.href))
				.map((el) => {
					loadedStyles.add(el.href);
					return fetch(el.href);
				})
		);
	} catch {}
}

export interface PrefetchOptions {
	/**
	 * Element selector used to find all links on the page that should be prefetched.
	 *
	 * @default 'a[href][rel~="prefetch"]'
	 */
	selector?: string;
	/**
	 * The number of pages that can be prefetched concurrently.
	 *
	 * @default 1
	 */
	throttle?: number;
	/**
	 * Element selector used to find all links on the page that should be prefetched on user interaction.
	 *
	 * @default 'a[href][rel~="prefetch-intent"]'
	 */
	intentSelector?: string | string[];
}

export default function prefetch({
	selector = 'a[href][rel~="prefetch"]',
	throttle = 1,
	intentSelector = 'a[href][rel~="prefetch-intent"]',
}: PrefetchOptions) {
	// If the navigator is offline, it is very unlikely that a request can be made successfully
	if (!navigator.onLine) {
		return Promise.reject(new Error('Cannot prefetch, no network connection'));
	}

	// `Navigator.connection` is an experimental API and is not supported in every browser.
	if ('connection' in navigator) {
		const connection = (navigator as any).connection;
		// Don't prefetch if Save-Data is enabled.
		if (connection.saveData) {
			return Promise.reject(new Error('Cannot prefetch, Save-Data is enabled'));
		}

		// Do not prefetch if using 2G or 3G
		if (/(2|3)g/.test(connection.effectiveType)) {
			return Promise.reject(new Error('Cannot prefetch, network conditions are poor'));
		}
	}

	const [toAdd, isDone] = throttles(throttle);

	observer =
		observer ||
		new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && entry.target instanceof HTMLAnchorElement) {
					const relAttributeValue = entry.target.getAttribute('rel') || '';
					let matchesIntentSelector = false;
					// Check if intentSelector is an array
					if (Array.isArray(intentSelector)) {
						// If intentSelector is an array, use .some() to check for matches
						matchesIntentSelector = intentSelector.some((intent) =>
							relAttributeValue.includes(intent)
						);
					} else {
						// If intentSelector is a string, use .includes() to check for a match
						matchesIntentSelector = relAttributeValue.includes(intentSelector);
					}
					if (!matchesIntentSelector) {
						toAdd(() => preloadHref(entry.target as HTMLAnchorElement).finally(isDone));
					}
				}
			});
		});

	requestIdleCallback(() => {
		const links = [...document.querySelectorAll<HTMLAnchorElement>(selector)].filter(shouldPreload);
		links.forEach(observe);

		const intentSelectorFinal = Array.isArray(intentSelector)
			? intentSelector.join(',')
			: intentSelector;
		// Observe links with prefetch-intent
		const intentLinks = [
			...document.querySelectorAll<HTMLAnchorElement>(intentSelectorFinal),
		].filter(shouldPreload);
		intentLinks.forEach((link) => {
			events.map((event) =>
				link.addEventListener(event, onLinkEvent, { passive: true, once: true })
			);
		});
	});
}
