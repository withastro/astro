import type { Fallback, Direction } from './types.js';
import {
	allowIntraPageTransitions,
	currentHistoryIndex,
	getFallback,
	inBrowser,
	setCurrentHistoryIndex,
	supportsViewTransitions,
	supportsNavigationAPI,
	transitionEnabledOnThisPage,
} from './util.js';
import {
	TransitionBeforeSwapEvent,
	TransitionPrepareEvent,
	definePreparation,
	doSwap,
	isTransitionPrepareEvent,
	triggerEvent,
	TRANSITION_AFTER_SWAP,
	onPageLoad,
	type Preparation,
	TRANSITION_PREPARE,
	navigationHook,
} from './events.js';

import { onNavigate } from './navigation-adapter.js';

type State = {
	index: number;
	scrollX: number;
	scrollY: number;
};

// when we update state of the current page, we use the navigation API where available
const wrap = (newState: any) => window.navigation.updateCurrentEntry({ state: newState });
const replaceState = (a: any, b: any) => {
	console.log('replacing', history.state, 'with', a);
	const func = supportsNavigationAPI ? wrap : history.replaceState.bind(history);
	console.log('func :>> ', func);
	func(a, b);
};
// only update history entries that are managed by us
// leave other entries alone and do not accidently add state.
const updateScrollPosition = (positions: { scrollX: number; scrollY: number }) =>
	history.state && history.replaceState({ ...history.state, ...positions }, '');

// When we traverse the history, the window.location is already set to the new location.
// This variable tells us where we come from
export let originalLocation: URL;

// The result of startViewTransition (browser or simulation)
let viewTransition: ViewTransition | undefined;
// The resolve function of the finished promise for fallback simulation
let viewTransitionFinished: () => void;
let skipTransition = false; // skip transition flag for fallback simulation

const samePage = (location: URL, otherLocation: URL) =>
	location.pathname === otherLocation.pathname && location.search === otherLocation.search;
const announce = () => {
	let div = document.createElement('div');
	div.setAttribute('aria-live', 'assertive');
	div.setAttribute('aria-atomic', 'true');
	div.className = 'astro-route-announcer';
	document.body.append(div);
	setTimeout(
		() => {
			let title = document.title || document.querySelector('h1')?.textContent || location.pathname;
			div.textContent = title;
		},
		// Much thought went into this magic number; the gist is that screen readers
		// need to see that the element changed and might not do so if it happens
		// too quickly.
		60
	);
};

const PERSIST_ATTR = 'data-astro-transition-persist';
const VITE_ID = 'data-vite-dev-id';

let parser: DOMParser;

if (inBrowser) {
	if (history.state) {
		// Here we reloaded a page with history state
		// (e.g. history navigation from non-transition page or browser reload)
		setCurrentHistoryIndex(history.state.index);
		scrollTo({ left: history.state.scrollX, top: history.state.scrollY });
	} else if (transitionEnabledOnThisPage()) {
		// This page is loaded from the browser addressbar or via a link from extern,
		// it needs a state in the history
		replaceState({ index: currentHistoryIndex, scrollX, scrollY }, '');
	}
}

const throttle = (cb: (...args: any[]) => any, delay: number) => {
	let wait = false;
	// During the waiting time additional events are lost.
	// So repeat the callback at the end if we have swallowed events.
	let onceMore = false;
	return (...args: any[]) => {
		if (wait) {
			onceMore = true;
			return;
		}
		cb(...args);
		wait = true;
		setTimeout(() => {
			if (onceMore) {
				onceMore = false;
				cb(...args);
			}
			wait = false;
		}, delay);
	};
};

// returns the contents of the page or null if the router can't deal with it.
async function fetchHTML(
	href: string
): Promise<null | { html: string; redirected?: string; mediaType: DOMParserSupportedType }> {
	try {
		const res = await fetch(href);
		// drop potential charset (+ other name/value pairs) as parser needs the mediaType
		const mediaType = res.headers.get('content-type')?.replace(/;.*$/, '');
		// the DOMParser can handle two types of HTML
		if (mediaType !== 'text/html' && mediaType !== 'application/xhtml+xml') {
			// everything else (e.g. audio/mp3) will be handled by the browser but not by us
			return null;
		}
		const html = await res.text();
		return {
			html,
			redirected: res.redirected ? res.url : undefined,
			mediaType,
		};
	} catch (err) {
		// can't fetch, let someone else deal with it.
		return null;
	}
}

function runScripts() {
	let wait = Promise.resolve();
	for (const script of Array.from(document.scripts)) {
		if (script.dataset.astroExec === '') continue;
		const newScript = document.createElement('script');
		newScript.innerHTML = script.innerHTML;
		for (const attr of script.attributes) {
			if (attr.name === 'src') {
				const p = new Promise((r) => {
					newScript.onload = r;
				});
				wait = wait.then(() => p as any);
			}
			newScript.setAttribute(attr.name, attr.value);
		}
		newScript.dataset.astroExec = '';
		script.replaceWith(newScript);
	}
	return wait;
}

// Add a new entry to the browser history. This also sets the new page in the browser addressbar.
// Sets the scroll position according to the hash fragment of the new location.
const moveToLocation = (
	to: URL,
	from: URL,
	options: NavigationNavigateOptions,
	historyState?: State
) => {
	const onSamePage = samePage(from, to);
	const intraPage = onSamePage && from.origin === to.origin;

	let scrolledToTop = false;
	if (to.href !== location.href && !historyState) {
		if (options.history === 'replace') {
			const current = history.state;
			history.replaceState(
				{
					...(options.state as any),
					index: current.index,
					scrollX: current.scrollX,
					scrollY: current.scrollY,
				},
				'',
				to.href
			);
		} else {
			setCurrentHistoryIndex(currentHistoryIndex + 1);
			history.pushState(
				{ ...(options.state as any), index: currentHistoryIndex, scrollX: 0, scrollY: 0 },
				'',
				to.href
			);
		}
	}
	// now we are on the new page for non-history navigations!
	// (with history navigation page change happens before popstate is fired)
	originalLocation = to;

	// freshly loaded pages start from the top
	if (!intraPage) {
		scrollTo({ left: 0, top: 0, behavior: 'instant' });
		scrolledToTop = true;
	}

	if (historyState) {
		scrollTo(historyState.scrollX, historyState.scrollY);
	} else {
		if (to.hash) {
			// because we are already on the target page ...
			// ... what comes next is a intra-page navigation
			// that won't reload the page but instead scroll to the fragment
			location.href = to.href;
		} else {
			if (!scrolledToTop) {
				scrollTo({ left: 0, top: 0, behavior: 'instant' });
			}
		}
	}
};

function stylePreloadLinks(newDocument: Document) {
	const links: Promise<any>[] = [];
	for (const el of newDocument.querySelectorAll('head link[rel=stylesheet]')) {
		// Do not preload links that are already on the page.
		if (
			!document.querySelector(
				`[${PERSIST_ATTR}="${el.getAttribute(
					PERSIST_ATTR
				)}"], link[rel=stylesheet][href="${el.getAttribute('href')}"]`
			)
		) {
			const c = document.createElement('link');
			c.setAttribute('rel', 'preload');
			c.setAttribute('as', 'style');
			c.setAttribute('href', el.getAttribute('href')!);
			links.push(
				new Promise<any>((resolve) => {
					['load', 'error'].forEach((evName) => c.addEventListener(evName, resolve));
					document.head.append(c);
				})
			);
		}
	}
	return links;
}

// replace head and body of the windows document with contents from newDocument
// if !popstate, update the history entry and scroll position according to toLocation
// if popState is given, this holds the scroll position for history navigation
// if fallback === "animate" then simulate view transitions
async function updateDOM(prepareEvent: TransitionPrepareEvent, fallback?: Fallback) {
	// Check for a head element that should persist and returns it,
	// either because it has the data attribute or is a link el.
	// Returns null if the element is not part of the new head, undefined if it should be left alone.
	const persistedHeadElement = (el: HTMLElement, newDocument: Document): Element | null => {
		const id = el.getAttribute(PERSIST_ATTR);
		const newEl = id && newDocument.head.querySelector(`[${PERSIST_ATTR}="${id}"]`);
		if (newEl) {
			return newEl;
		}
		if (el.matches('link[rel=stylesheet]')) {
			const href = el.getAttribute('href');
			return newDocument.head.querySelector(`link[rel=stylesheet][href="${href}"]`);
		}
		return null;
	};

	type SavedFocus = {
		activeElement: HTMLElement | null;
		start?: number | null;
		end?: number | null;
	};

	const saveFocus = (): SavedFocus => {
		const activeElement = document.activeElement as HTMLElement;
		// The element that currently has the focus is part of a DOM tree
		// that will survive the transition to the new document.
		// Save the element and the cursor position
		if (activeElement?.closest(`[${PERSIST_ATTR}]`)) {
			if (
				activeElement instanceof HTMLInputElement ||
				activeElement instanceof HTMLTextAreaElement
			) {
				const start = activeElement.selectionStart;
				const end = activeElement.selectionEnd;
				return { activeElement, start, end };
			}
			return { activeElement };
		} else {
			return { activeElement: null };
		}
	};

	const restoreFocus = ({ activeElement, start, end }: SavedFocus) => {
		if (activeElement) {
			activeElement.focus();
			if (
				activeElement instanceof HTMLInputElement ||
				activeElement instanceof HTMLTextAreaElement
			) {
				activeElement.selectionStart = start!;
				activeElement.selectionEnd = end!;
			}
		}
	};

	const defaultSwap = (beforeSwapEvent: TransitionBeforeSwapEvent) => {
		console.log('Default swap', beforeSwapEvent.type);

		if (
			beforeSwapEvent.newDocument.documentElement &&
			beforeSwapEvent.newDocument.documentElement !== document.documentElement
		) {
			// swap attributes of the html element
			// - delete all attributes from the current document
			// - insert all attributes from doc
			// - reinsert all original attributes that are named 'data-astro-*'
			const html = document.documentElement;
			const astroAttributes = [...html.attributes].filter(
				({ name }) => (html.removeAttribute(name), name.startsWith('data-astro-'))
			);
			[...beforeSwapEvent.newDocument.documentElement.attributes, ...astroAttributes].forEach(
				({ name, value }) => html.setAttribute(name, value)
			);
		}
		// Replace scripts in both the head and body.
		for (const s1 of document.scripts) {
			for (const s2 of beforeSwapEvent.newDocument.scripts) {
				if (
					// Inline
					(!s1.src && s1.textContent === s2.textContent) ||
					// External
					(s1.src && s1.type === s2.type && s1.src === s2.src)
				) {
					// the old script is in the new document: we mark it as executed to prevent re-execution
					s2.dataset.astroExec = '';
					break;
				}
			}
		}

		// Swap head
		if (beforeSwapEvent.newDocument.head && beforeSwapEvent.newDocument.head !== document.head) {
			for (const el of Array.from(document.head.children)) {
				const newEl = persistedHeadElement(el as HTMLElement, beforeSwapEvent.newDocument);
				// If the element exists in the document already, remove it
				// from the new document and leave the current node alone
				if (newEl) {
					newEl.remove();
				} else {
					// Otherwise remove the element in the head. It doesn't exist in the new page.
					el.remove();
				}
			}

			// Everything left in the new head is new, append it all.
			document.head.append(...beforeSwapEvent.newDocument.head.children);
		}

		if (beforeSwapEvent.newDocument.body && beforeSwapEvent.newDocument.body !== document.body) {
			// Persist elements in the existing body
			const oldBody = document.body;

			const savedFocus = saveFocus();

			// this will reset scroll Position
			document.body.replaceWith(beforeSwapEvent.newDocument.body);

			for (const el of oldBody.querySelectorAll(`[${PERSIST_ATTR}]`)) {
				const id = el.getAttribute(PERSIST_ATTR);
				const newEl = document.querySelector(`[${PERSIST_ATTR}="${id}"]`);
				if (newEl) {
					// The element exists in the new page, replace it with the element
					// from the old page so that state is preserved.
					newEl.replaceWith(el);
				}
			}
			restoreFocus(savedFocus);
		}
		console.log('Default swap done');
	};

	async function animate(phase: string) {
		function isInfinite(animation: Animation) {
			const effect = animation.effect;
			if (!effect || !(effect instanceof KeyframeEffect) || !effect.target) return false;
			const style = window.getComputedStyle(effect.target, effect.pseudoElement);
			return style.animationIterationCount === 'infinite';
		}

		// Trigger the animations
		const currentAnimations = document.getAnimations();
		document.documentElement.dataset.astroTransitionFallback = phase;
		const newAnimations = document
			.getAnimations()
			.filter((a) => !currentAnimations.includes(a) && !isInfinite(a));
		return Promise.all(newAnimations.map((a) => a.finished));
	}

	if (fallback === 'animate' && !skipTransition) {
		await animate('old');
	}

	const swapEvent = await doSwap(prepareEvent, viewTransition!, defaultSwap);
	document.documentElement.dataset.astroTransition = swapEvent.direction;

	triggerEvent(TRANSITION_AFTER_SWAP);

	if (fallback === 'animate' && !skipTransition) {
		animate('new').then(() => viewTransitionFinished());
	}
}

export async function defaultLoader(e: TransitionPrepareEvent) {
	console.log('"defaultLoader", e.tpye :>> ', 'defaultLoader', e.type);
	const extension = e.astro;
	const href = extension.to.href;
	const response = await fetchHTML(href);

	// If there is a problem fetching the new page, just do an MPA navigation to it.
	if (response === null) {
		location.href = href;
		return;
	}
	// if there was a redirection, show the final URL in the browser's address bar
	if (response.redirected) {
		extension.to = new URL(response.redirected);
	}
	parser ??= new DOMParser();

	extension.newDocument = parser.parseFromString(response.html, response.mediaType);
	// The next line might look like a hack,
	// but it is actually necessary as noscript elements
	// and their contents are returned as markup by the parser,
	// see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
	extension.newDocument.querySelectorAll('noscript').forEach((el: HTMLElement) => el.remove());
	if (!extension.newDocument.querySelector('[name="astro-view-transitions-enabled"]')) {
		location.href = href;
		return;
	}
	if (import.meta.env.DEV)
		await prepareForClientOnlyComponents(extension.newDocument, extension.to);
	console.log('"defaultLoader" :>> ', 'done');
}

async function simulateNavigationAPI(
	direction: Direction,
	from: URL,
	to: URL,
	navigateOptions: NavigationNavigateOptions,
	historyState?: State
) {
	const interceptors: NavigationInterceptOptions[] = [];

	// set Astro extensions
	const preparation: Preparation = definePreparation(
		from,
		to,
		direction,
		navigateOptions,
		historyState
	);
	const prepareEvent = new TransitionPrepareEvent(
		!!historyState ? 'traverse' : navigateOptions.history === 'replace' ? 'replace' : 'push',
		navigateOptions.info,
		(opts) => {
			interceptors.push(opts);
		},
		preparation.extension
	);
	preparation.event = prepareEvent;
	preparation.extension.loader = defaultLoader.bind(null, prepareEvent);
	window.navigation.addEventListener(
		'navigate',
		(e) => {
			onNavigateCore(e, preparation);
		},
		{ once: true }
	);
	window.navigation.dispatchEvent(prepareEvent);

	// only if we polyfilled the navigation API
	if (interceptors.length > 0) {
		await Promise.all(
			interceptors.map((interceptor) =>
				interceptor.handler ? interceptor.handler() : Promise.resolve()
			)
		);
		moveToLocation(to, from, navigateOptions, historyState);
	}
}

export async function onNavigateCore(prepareEvent: Event, preparation: Preparation) {
	if (!isTransitionPrepareEvent(prepareEvent)) {
		return;
	}

	if (prepareEvent.navigationType !== 'traverse') {
		// save the current scroll position before we change the DOM and transition to the new page
		updateScrollPosition({ scrollX, scrollY });
	}

	prepareEvent.intercept({
		// add options for scrolling and delayed state handling
		async handler() {
			const res = await fetch(prepareEvent.astro.to);
			const text = await res.text();
			const newDocument = new DOMParser().parseFromString(text, 'text/html');
			window.document.documentElement.replaceWith(newDocument.documentElement);
			if (prepareEvent.navigationType !== 'traverse' && transitionEnabledOnThisPage()) {
				setCurrentHistoryIndex(currentHistoryIndex + 1);
				replaceState({ index: currentHistoryIndex, scrollX, scrollY }, '');
			}
			window.navigation.entries().forEach((entry) => {
				console.log('entry.getState() :>> ', entry.getState());
			});
			await preparation.run(prepareEvent);

			const links = stylePreloadLinks(prepareEvent.astro.newDocument);
			links.length && (await Promise.all(links));
			skipTransition = false;
			if (viewTransition) {
				// do something clever here
			}
			if (supportsViewTransitions) {
				viewTransition = document.startViewTransition(async () => await updateDOM(prepareEvent));
			} else {
				const updateDone = (async () => {
					// immediatelly paused to setup the ViewTransition object for Fallback mode
					await new Promise((r) => setTimeout(r));
					await updateDOM(prepareEvent, getFallback());
				})();

				// When the updateDone promise is settled,
				// we have run and awaited all swap functions and the after-swap event
				// This qualifies for "updateCallbackDone".
				//
				// For the build in ViewTransition, "ready" settles shortly after "updateCallbackDone",
				// i.e.after all pseudo elements are created and the animation is about to start.
				// In simulation mode the "old" animation starts before swap,
				// the "new" animation starts after swap. That is not really comparable.
				// Thus we go with "very, very shortly after updateCallbackDone" and make both equal.
				//
				// "finished" resolves after all animations are done.

				viewTransition = {
					updateCallbackDone: updateDone, // this is about correct
					ready: updateDone, // good enough
					finished: new Promise((r) => (viewTransitionFinished = r)), // see end of updateDOM
					skipTransition: () => {
						skipTransition = true;
					},
				};
			}
			if (samePage(originalLocation, prepareEvent.astro.to) && !allowIntraPageTransitions) {
				viewTransition.skipTransition();
			}

			viewTransition.updateCallbackDone.then(async () => {
				await runScripts();
				onPageLoad();
				announce();
			});
			viewTransition.finished.then(() => {
				document.documentElement.removeAttribute('data-astro-transition'); // direction
				document.documentElement.removeAttribute('data-astro-transition-fallback'); // new or old
				//		viewTransition = undefined;
			});
			await viewTransition.updateCallbackDone;
		},
	});
}

let navigateOnServerWarned = false;

export function navigate(href: string, options?: NavigationNavigateOptions) {
	if (inBrowser === false) {
		if (!navigateOnServerWarned) {
			// instantiate an error for the stacktrace to show to user.
			const warning = new Error(
				'The view transtions client API was called during a server side render. This may be unintentional as the navigate() function is expected to be called in response to user interactions. Please make sure that your usage is correct.'
			);
			warning.name = 'Warning';
			// eslint-disable-next-line no-console
			console.warn(warning);
			navigateOnServerWarned = true;
		}
		return;
	}

	// not ours
	if (!transitionEnabledOnThisPage()) {
		location.href = href;
		return;
	}

	simulateNavigationAPI('forward', originalLocation, new URL(href, location.href), options ?? {});
}

function onPopState(ev: PopStateEvent) {
	console.log(ev.state);

	if (!transitionEnabledOnThisPage() && ev.state) {
		// The current page doesn't have View Transitions enabled
		// but the page we navigate to does (because it set the state).
		// Do a full page refresh to reload the client-side router from the new page.
		// Scroll restauration will then happen during the reload when the router's code is re-executed
		if (history.scrollRestoration) {
			history.scrollRestoration = 'manual';
		}
		location.reload();
		return;
	}

	// History entries without state are created by the browser
	// Our view transition entries always have state.
	// Just ignore stateless entries.
	// The browser will handle navigation fine without our help
	if (ev.state === null) {
		if (history.scrollRestoration) {
			history.scrollRestoration = 'auto';
		}
		return;
	}

	// With the default "auto", the browser will jump to the old scroll position
	// before the ViewTransition is complete.
	if (history.scrollRestoration) {
		history.scrollRestoration = 'manual';
	}

	const state: State = history.state;
	const nextIndex = state.index;
	const direction: Direction = nextIndex > currentHistoryIndex ? 'forward' : 'back';
	setCurrentHistoryIndex(nextIndex);
	simulateNavigationAPI(direction, originalLocation, new URL(location.href), {}, state);
}

// There's not a good way to record scroll position before a back button.
// So the way we do it is by listening to scrollend if supported, and if not continuously record the scroll position.
const onScroll = () => {
	updateScrollPosition({ scrollX, scrollY });
};

// initialization
if (inBrowser) {
	if (supportsViewTransitions || getFallback() !== 'none') {
		originalLocation ??= new URL(location.href);
		//addEventListener('popstate', onPopState);
		addEventListener('load', onPageLoad);
		if ('onscrollend' in window) addEventListener('scrollend', onScroll);
		else addEventListener('scroll', throttle(onScroll, 350), { passive: true });
		if (supportsNavigationAPI) {
			// order express delivery of navigate events
			document.addEventListener('astro:connect', (e) => onNavigate((e as CustomEvent).detail));
		}

		if (!supportsNavigationAPI) {
			// @ts-ignore
			window.navigation ??= {
				// no complete polyfill, no state handling, only navigation and NavigateEvents
				navigate,
				dispatchEvent: document.dispatchEvent.bind(document),
				addEventListener: document.addEventListener.bind(document),
			};
		}
	}
	window.navigation.addEventListener(TRANSITION_PREPARE, onNavigate);
	for (const script of document.scripts) {
		script.dataset.astroExec = '';
	}
	window.navigation.addEventListener('navigateerror', (ev) => {
		console.log('navigateerror', ev.error);
	});
}

// Keep all styles that are potentially created by client:only components
// and required on the next page
async function prepareForClientOnlyComponents(newDocument: Document, toLocation: URL) {
	// Any client:only component on the next page?
	if (newDocument.body.querySelector(`astro-island[client='only']`)) {
		// Load the next page with an empty module loader cache
		const nextPage = document.createElement('iframe');
		nextPage.src = toLocation.href;
		nextPage.style.display = 'none';
		document.body.append(nextPage);
		// silence the iframe's console
		// @ts-ignore
		nextPage.contentWindow!.console = Object.keys(console).reduce((acc: any, key) => {
			acc[key] = () => {};
			return acc;
		}, {});
		await hydrationDone(nextPage);

		const nextHead = nextPage.contentDocument?.head;
		if (nextHead) {
			// Clear former persist marks
			document.head
				.querySelectorAll(`style[${PERSIST_ATTR}=""]`)
				.forEach((s) => s.removeAttribute(PERSIST_ATTR));

			// Collect the vite ids of all styles present in the next head
			const viteIds = [...nextHead.querySelectorAll(`style[${VITE_ID}]`)].map((style) =>
				style.getAttribute(VITE_ID)
			);
			// Copy required styles to the new document if they are from hydration.
			viteIds.forEach((id) => {
				const style = document.head.querySelector(`style[${VITE_ID}="${id}"]`);
				if (style && !newDocument.head.querySelector(`style[${VITE_ID}="${id}"]`)) {
					newDocument.head.appendChild(style.cloneNode(true));
				}
			});
		}

		// return a promise that resolves when all astro-islands are hydrated
		async function hydrationDone(loadingPage: HTMLIFrameElement) {
			await new Promise(
				(r) => loadingPage.contentWindow?.addEventListener('load', r, { once: true })
			);

			return new Promise<void>(async (r) => {
				for (let count = 0; count <= 20; ++count) {
					if (!loadingPage.contentDocument!.body.querySelector('astro-island[ssr]')) break;
					await new Promise((r2) => setTimeout(r2, 50));
				}
				r();
			});
		}
	}
}
