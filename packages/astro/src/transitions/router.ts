import type { TransitionBeforePreparationEvent, TransitionBeforeSwapEvent } from './events.js';
import { TRANSITION_AFTER_SWAP, doPreparation, doSwap } from './events.js';
import type { Direction, Fallback, Options } from './types.js';

type State = {
	index: number;
	scrollX: number;
	scrollY: number;
};
type Events = 'astro:page-load' | 'astro:after-swap';

// Create bound versions of pushState/replaceState so that Partytown doesn't hijack them,
// which breaks Firefox.
const inBrowser = import.meta.env.SSR === false;
const pushState = (inBrowser && history.pushState.bind(history)) as typeof history.pushState;
const replaceState = (inBrowser &&
	history.replaceState.bind(history)) as typeof history.replaceState;

// only update history entries that are managed by us
// leave other entries alone and do not accidently add state.
export const updateScrollPosition = (positions: { scrollX: number; scrollY: number }) => {
	if (history.state) {
		history.scrollRestoration = 'manual';
		replaceState({ ...history.state, ...positions }, '');
	}
};

export const supportsViewTransitions = inBrowser && !!document.startViewTransition;

export const transitionEnabledOnThisPage = () =>
	inBrowser && !!document.querySelector('[name="astro-view-transitions-enabled"]');

const samePage = (thisLocation: URL, otherLocation: URL) =>
	thisLocation.pathname === otherLocation.pathname && thisLocation.search === otherLocation.search;

// When we traverse the history, the window.location is already set to the new location.
// This variable tells us where we came from
let originalLocation: URL;
// The result of startViewTransition (browser or simulation)
let viewTransition: ViewTransition | undefined;
// skip transition flag for fallback simulation
let skipTransition = false;
// The resolve function of the finished promise for fallback simulation
let viewTransitionFinished: () => void;

const triggerEvent = (name: Events) => document.dispatchEvent(new Event(name));
const onPageLoad = () => triggerEvent('astro:page-load');
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
const DIRECTION_ATTR = 'data-astro-transition';
const OLD_NEW_ATTR = 'data-astro-transition-fallback';

const VITE_ID = 'data-vite-dev-id';

let parser: DOMParser;

// The History API does not tell you if navigation is forward or back, so
// you can figure it using an index. On pushState the index is incremented so you
// can use that to determine popstate if going forward or back.
let currentHistoryIndex = 0;

if (inBrowser) {
	if (history.state) {
		// Here we reloaded a page with history state
		// (e.g. history navigation from non-transition page or browser reload)
		currentHistoryIndex = history.state.index;
		scrollTo({ left: history.state.scrollX, top: history.state.scrollY });
	} else if (transitionEnabledOnThisPage()) {
		// This page is loaded from the browser addressbar or via a link from extern,
		// it needs a state in the history
		replaceState({ index: currentHistoryIndex, scrollX, scrollY }, '');
		history.scrollRestoration = 'manual';
	}
}

// returns the contents of the page or null if the router can't deal with it.
async function fetchHTML(
	href: string,
	init?: RequestInit
): Promise<null | { html: string; redirected?: string; mediaType: DOMParserSupportedType }> {
	try {
		const res = await fetch(href, init);
		const contentType = res.headers.get('content-type') ?? '';
		// drop potential charset (+ other name/value pairs) as parser needs the mediaType
		const mediaType = contentType.split(';', 1)[0].trim();
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

function getFallback(): Fallback {
	const el = document.querySelector('[name="astro-view-transitions-fallback"]');
	if (el) {
		return el.getAttribute('content') as Fallback;
	}
	return 'animate';
}

function runScripts() {
	let wait = Promise.resolve();
	for (const script of Array.from(document.scripts)) {
		if (script.dataset.astroExec === '') continue;
		const type = script.getAttribute('type');
		if (type && type !== 'module' && type !== 'text/javascript') continue;
		const newScript = document.createElement('script');
		newScript.innerHTML = script.innerHTML;
		for (const attr of script.attributes) {
			if (attr.name === 'src') {
				const p = new Promise((r) => {
					newScript.onload = newScript.onerror = r;
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
	options: Options,
	pageTitleForBrowserHistory: string,
	historyState?: State
) => {
	const intraPage = samePage(from, to);

	const targetPageTitle = document.title;
	document.title = pageTitleForBrowserHistory;

	let scrolledToTop = false;
	if (to.href !== location.href && !historyState) {
		if (options.history === 'replace') {
			const current = history.state;
			replaceState(
				{
					...options.state,
					index: current.index,
					scrollX: current.scrollX,
					scrollY: current.scrollY,
				},
				'',
				to.href
			);
		} else {
			pushState(
				{ ...options.state, index: ++currentHistoryIndex, scrollX: 0, scrollY: 0 },
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
			history.scrollRestoration = 'auto';
			const savedState = history.state;
			location.href = to.href; // this kills the history state on Firefox
			history.state || replaceState(savedState, ''); // this restores the history state
		} else {
			if (!scrolledToTop) {
				scrollTo({ left: 0, top: 0, behavior: 'instant' });
			}
		}
		history.scrollRestoration = 'manual';
	}
	document.title = targetPageTitle;
};

function preloadStyleLinks(newDocument: Document) {
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
async function updateDOM(
	preparationEvent: TransitionBeforePreparationEvent,
	options: Options,
	historyState?: State,
	fallback?: Fallback
) {
	// Check for a head element that should persist and returns it,
	// either because it has the data attribute or is a link el.
	// Returns null if the element is not part of the new head, undefined if it should be left alone.
	const persistedHeadElement = (el: HTMLElement, newDoc: Document): Element | null => {
		const id = el.getAttribute(PERSIST_ATTR);
		const newEl = id && newDoc.head.querySelector(`[${PERSIST_ATTR}="${id}"]`);
		if (newEl) {
			return newEl;
		}
		if (el.matches('link[rel=stylesheet]')) {
			const href = el.getAttribute('href');
			return newDoc.head.querySelector(`link[rel=stylesheet][href="${href}"]`);
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

	const shouldCopyProps = (el: HTMLElement): boolean => {
		const persistProps = el.dataset.astroTransitionPersistProps;
		return persistProps == null || persistProps === 'false';
	};

	const defaultSwap = (beforeSwapEvent: TransitionBeforeSwapEvent) => {
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

		// Replace scripts in both the head and body.
		for (const s1 of document.scripts) {
			for (const s2 of beforeSwapEvent.newDocument.scripts) {
				if (
					// Check if the script should be rerun regardless of it being the same
					!s2.hasAttribute('data-astro-rerun') &&
					// Inline
					((!s1.src && s1.textContent === s2.textContent) ||
						// External
						(s1.src && s1.type === s2.type && s1.src === s2.src))
				) {
					// the old script is in the new document and doesn't have the rerun attribute
					// we mark it as executed to prevent re-execution
					s2.dataset.astroExec = '';
					break;
				}
			}
		}

		// Swap head
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
				// For islands, copy over the props to allow them to re-render
				if (newEl.localName === 'astro-island' && shouldCopyProps(el as HTMLElement)) {
					el.setAttribute('ssr', '');
					el.setAttribute('props', newEl.getAttribute('props')!);
				}
			}
		}
		restoreFocus(savedFocus);
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
		document.documentElement.setAttribute(OLD_NEW_ATTR, phase);
		const nextAnimations = document.getAnimations();
		const newAnimations = nextAnimations.filter(
			(a) => !currentAnimations.includes(a) && !isInfinite(a)
		);
		return Promise.all(newAnimations.map((a) => a.finished));
	}

	if (!skipTransition) {
		document.documentElement.setAttribute(DIRECTION_ATTR, preparationEvent.direction);

		if (fallback === 'animate') {
			await animate('old');
		}
	} else {
		// that's what Chrome does
		throw new DOMException('Transition was skipped');
	}

	const pageTitleForBrowserHistory = document.title; // document.title will be overridden by swap()
	const swapEvent = await doSwap(preparationEvent, viewTransition!, defaultSwap);
	moveToLocation(swapEvent.to, swapEvent.from, options, pageTitleForBrowserHistory, historyState);
	triggerEvent(TRANSITION_AFTER_SWAP);

	if (fallback === 'animate' && !skipTransition) {
		animate('new').then(() => viewTransitionFinished());
	}
}

async function transition(
	direction: Direction,
	from: URL,
	to: URL,
	options: Options,
	historyState?: State
) {
	// not ours
	if (!transitionEnabledOnThisPage() || location.origin !== to.origin) {
		location.href = to.href;
		return;
	}

	const navigationType = historyState
		? 'traverse'
		: options.history === 'replace'
			? 'replace'
			: 'push';

	if (navigationType !== 'traverse') {
		updateScrollPosition({ scrollX, scrollY });
	}
	if (samePage(from, to)) {
		if ((direction !== 'back' && to.hash) || (direction === 'back' && from.hash)) {
			moveToLocation(to, from, options, document.title, historyState);
			return;
		}
	}

	const prepEvent = await doPreparation(
		from,
		to,
		direction,
		navigationType,
		options.sourceElement,
		options.info,
		options.formData,
		defaultLoader
	);
	if (prepEvent.defaultPrevented) {
		location.href = to.href;
		return;
	}

	async function defaultLoader(preparationEvent: TransitionBeforePreparationEvent) {
		const href = preparationEvent.to.href;
		const init: RequestInit = {};
		if (preparationEvent.formData) {
			init.method = 'POST';
			const form =
				preparationEvent.sourceElement instanceof HTMLFormElement
					? preparationEvent.sourceElement
					: preparationEvent.sourceElement instanceof HTMLElement &&
						  'form' in preparationEvent.sourceElement
						? (preparationEvent.sourceElement.form as HTMLFormElement)
						: preparationEvent.sourceElement?.closest('form');
			// Form elements without enctype explicitly set default to application/x-www-form-urlencoded.
			// In order to maintain compatibility with Astro 4.x, we need to check the value of enctype
			// on the attributes property rather than accessing .enctype directly. Astro 5.x may
			// introduce defaulting to application/x-www-form-urlencoded as a breaking change, and then
			// we can access .enctype directly.
			//
			// Note: getNamedItem can return null in real life, even if TypeScript doesn't think so, hence
			// the ?.
			init.body =
				form?.attributes.getNamedItem('enctype')?.value === 'application/x-www-form-urlencoded'
					? new URLSearchParams(preparationEvent.formData as any)
					: preparationEvent.formData;
		}
		const response = await fetchHTML(href, init);
		// If there is a problem fetching the new page, just do an MPA navigation to it.
		if (response === null) {
			preparationEvent.preventDefault();
			return;
		}
		// if there was a redirection, show the final URL in the browser's address bar
		if (response.redirected) {
			preparationEvent.to = new URL(response.redirected);
		}

		parser ??= new DOMParser();

		preparationEvent.newDocument = parser.parseFromString(response.html, response.mediaType);
		// The next line might look like a hack,
		// but it is actually necessary as noscript elements
		// and their contents are returned as markup by the parser,
		// see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
		preparationEvent.newDocument.querySelectorAll('noscript').forEach((el) => el.remove());

		// If ViewTransitions is not enabled on the incoming page, do a full page load to it.
		// Unless this was a form submission, in which case we do not want to trigger another mutation.
		if (
			!preparationEvent.newDocument.querySelector('[name="astro-view-transitions-enabled"]') &&
			!preparationEvent.formData
		) {
			preparationEvent.preventDefault();
			return;
		}

		const links = preloadStyleLinks(preparationEvent.newDocument);
		links.length && (await Promise.all(links));

		if (import.meta.env.DEV)
			await prepareForClientOnlyComponents(preparationEvent.newDocument, preparationEvent.to);
	}

	skipTransition = false;
	if (supportsViewTransitions) {
		viewTransition = document.startViewTransition(
			async () => await updateDOM(prepEvent, options, historyState)
		);
	} else {
		const updateDone = (async () => {
			// immediatelly paused to setup the ViewTransition object for Fallback mode
			await new Promise((r) => setTimeout(r));
			await updateDOM(prepEvent, options, historyState, getFallback());
		})();

		// When the updateDone promise is settled,
		// we have run and awaited all swap functions and the after-swap event
		// This qualifies for "updateCallbackDone".
		//
		// For the build in ViewTransition, "ready" settles shortly after "updateCallbackDone",
		// i.e. after all pseudo elements are created and the animation is about to start.
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

	viewTransition.ready.then(async () => {
		await runScripts();
		onPageLoad();
		announce();
	});
	viewTransition.finished.then(() => {
		document.documentElement.removeAttribute(DIRECTION_ATTR);
		document.documentElement.removeAttribute(OLD_NEW_ATTR);
	});
	await viewTransition.ready;
}

let navigateOnServerWarned = false;

export async function navigate(href: string, options?: Options) {
	if (inBrowser === false) {
		if (!navigateOnServerWarned) {
			// instantiate an error for the stacktrace to show to user.
			const warning = new Error(
				'The view transitions client API was called during a server side render. This may be unintentional as the navigate() function is expected to be called in response to user interactions. Please make sure that your usage is correct.'
			);
			warning.name = 'Warning';
			// eslint-disable-next-line no-console
			console.warn(warning);
			navigateOnServerWarned = true;
		}
		return;
	}
	await transition('forward', originalLocation, new URL(href, location.href), options ?? {});
}

function onPopState(ev: PopStateEvent) {
	if (!transitionEnabledOnThisPage() && ev.state) {
		// The current page doesn't have View Transitions enabled
		// but the page we navigate to does (because it set the state).
		// Do a full page refresh to reload the client-side router from the new page.
		location.reload();
		return;
	}

	// History entries without state are created by the browser (e.g. for hash links)
	// Our view transition entries always have state.
	// Just ignore stateless entries.
	// The browser will handle navigation fine without our help
	if (ev.state === null) {
		return;
	}
	const state: State = history.state;
	const nextIndex = state.index;
	const direction: Direction = nextIndex > currentHistoryIndex ? 'forward' : 'back';
	currentHistoryIndex = nextIndex;
	transition(direction, originalLocation, new URL(location.href), {}, state);
}

const onScrollEnd = () => {
	// NOTE: our "popstate" event handler may call `pushState()` or
	// `replaceState()` and then `scrollTo()`, which will fire "scroll" and
	// "scrollend" events. To avoid redundant work and expensive calls to
	// `replaceState()`, we simply check that the values are different before
	// updating.
	if (history.state && (scrollX !== history.state.scrollX || scrollY !== history.state.scrollY)) {
		updateScrollPosition({ scrollX, scrollY });
	}
};

// initialization
if (inBrowser) {
	if (supportsViewTransitions || getFallback() !== 'none') {
		originalLocation = new URL(location.href);
		addEventListener('popstate', onPopState);
		addEventListener('load', onPageLoad);
		// There's not a good way to record scroll position before a history back
		// navigation, so we will record it when the user has stopped scrolling.
		if ('onscrollend' in window) addEventListener('scrollend', onScrollEnd);
		else {
			// Keep track of state between intervals
			let intervalId: number | undefined, lastY: number, lastX: number, lastIndex: State['index'];
			const scrollInterval = () => {
				// Check the index to see if a popstate event was fired
				if (lastIndex !== history.state?.index) {
					clearInterval(intervalId);
					intervalId = undefined;
					return;
				}
				// Check if the user stopped scrolling
				if (lastY === scrollY && lastX === scrollX) {
					// Cancel the interval and update scroll positions
					clearInterval(intervalId);
					intervalId = undefined;
					onScrollEnd();
					return;
				} else {
					// Update vars with current positions
					(lastY = scrollY), (lastX = scrollX);
				}
			};
			// We can't know when or how often scroll events fire, so we'll just use them to start intervals
			addEventListener(
				'scroll',
				() => {
					if (intervalId !== undefined) return;
					(lastIndex = history.state.index), (lastY = scrollY), (lastX = scrollX);
					intervalId = window.setInterval(scrollInterval, 50);
				},
				{ passive: true }
			);
		}
	}
	for (const script of document.scripts) {
		script.dataset.astroExec = '';
	}
}

// Keep all styles that are potentially created by client:only components
// and required on the next page
async function prepareForClientOnlyComponents(newDocument: Document, toLocation: URL) {
	// Any client:only component on the next page?
	if (newDocument.body.querySelector(`astro-island[client='only']`)) {
		// Load the next page with an empty module loader cache
		const nextPage = document.createElement('iframe');
		// with srcdoc resolving imports does not work on webkit browsers
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
			// Collect the vite ids of all styles present in the next head
			const viteIds = [...nextHead.querySelectorAll(`style[${VITE_ID}]`)].map((style) =>
				style.getAttribute(VITE_ID)
			);
			// Copy required styles to the new document if they are from hydration.
			viteIds.forEach((id) => {
				const style = nextHead.querySelector(`style[${VITE_ID}="${id}"]`);
				if (style && !newDocument.head.querySelector(`style[${VITE_ID}="${id}"]`)) {
					newDocument.head.appendChild(style.cloneNode(true));
				}
			});
		}

		// return a promise that resolves when all astro-islands are hydrated
		async function hydrationDone(loadingPage: HTMLIFrameElement) {
			await new Promise((r) =>
				loadingPage.contentWindow?.addEventListener('load', r, { once: true })
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
