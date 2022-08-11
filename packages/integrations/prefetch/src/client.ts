import throttles from 'throttles';
import '../@types/network-information.d.ts';
import requestIdleCallback from './requestIdleCallback.js';

const events = ['mouseenter', 'touchstart', 'focus'];

const preloaded = new Set<string>();

function shouldPreload({ href }: { href: string }) {
	try {
		const url = new URL(href);
		return (
			window.location.origin === url.origin &&
			window.location.pathname !== url.hash &&
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
	events.map((event) => link.addEventListener(event, onLinkEvent, { passive:true, once: true }));
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
		parser = parser || new DOMParser();

		const html = parser.parseFromString(contents, 'text/html');
		const styles = Array.from(html.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));

		await Promise.all(styles.map((el) => fetch(el.href)));
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
}

export default function prefetch({
	selector = 'a[href][rel~="prefetch"]',
	throttle = 1,
}: PrefetchOptions) {
	const conn = navigator.connection;

	if (typeof conn !== 'undefined') {
		// Don't prefetch if using 2G or if Save-Data is enabled.
		if (conn.saveData) {
			return Promise.reject(new Error('Cannot prefetch, Save-Data is enabled'));
		}
		if (/2g/.test(conn.effectiveType)) {
			return Promise.reject(new Error('Cannot prefetch, network conditions are poor'));
		}
	}

	const [toAdd, isDone] = throttles(throttle);

	observer =
		observer ||
		new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && entry.target instanceof HTMLAnchorElement) {
					toAdd(() => preloadHref(entry.target as HTMLAnchorElement).finally(isDone));
				}
			});
		});

	requestIdleCallback(() => {
		const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector)).filter(
			shouldPreload
		);

		for (const link of links) {
			observe(link);
		}
	});
}
