import { internalFetchHeaders } from 'virtual:astro:adapter-config/client';
import { doPreparation, doSwap, onPageLoad, triggerEvent, updateScrollPosition } from './events.js';
import { detectScriptExecuted } from './swap-functions.js';
const inBrowser = import.meta.env.SSR === false;
const supportsViewTransitions = inBrowser && !!document.startViewTransition;
const transitionEnabledOnThisPage = () =>
	inBrowser && !!document.querySelector('[name="astro-view-transitions-enabled"]');
const samePage = (thisLocation, otherLocation) =>
	thisLocation.pathname === otherLocation.pathname && thisLocation.search === otherLocation.search;
let mostRecentNavigation;
let mostRecentTransition;
let originalLocation;
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
		60,
	);
};
const PERSIST_ATTR = 'data-astro-transition-persist';
const DIRECTION_ATTR = 'data-astro-transition';
const OLD_NEW_ATTR = 'data-astro-transition-fallback';
const VITE_ID = 'data-vite-dev-id';
let parser;
let currentHistoryIndex = 0;
if (inBrowser) {
	if (history.state) {
		currentHistoryIndex = history.state.index;
		scrollTo({ left: history.state.scrollX, top: history.state.scrollY });
	} else if (transitionEnabledOnThisPage()) {
		history.replaceState({ index: currentHistoryIndex, scrollX, scrollY }, '');
		history.scrollRestoration = 'manual';
	}
}
async function fetchHTML(href, init) {
	try {
		const headers = new Headers(init?.headers);
		for (const [key, value] of Object.entries(internalFetchHeaders)) {
			headers.set(key, value);
		}
		const res = await fetch(href, { ...init, headers });
		const contentType = res.headers.get('content-type') ?? '';
		const mediaType = contentType.split(';', 1)[0].trim();
		if (mediaType !== 'text/html' && mediaType !== 'application/xhtml+xml') {
			return null;
		}
		const html = await res.text();
		return {
			html,
			redirected: res.redirected ? res.url : void 0,
			mediaType,
		};
	} catch {
		return null;
	}
}
function getFallback() {
	const el = document.querySelector('[name="astro-view-transitions-fallback"]');
	if (el) {
		return el.getAttribute('content');
	}
	return 'animate';
}
function runScripts() {
	let wait = Promise.resolve();
	let needsWaitForInlineModuleScript = false;
	for (const script of document.getElementsByTagName('script')) {
		script.dataset.astroExec === void 0 &&
			script.getAttribute('type') === 'module' &&
			(needsWaitForInlineModuleScript = script.getAttribute('src') === null);
	}
	needsWaitForInlineModuleScript &&
		document.body.insertAdjacentHTML(
			'beforeend',
			`<script type="module" src="data:application/javascript,"/>`,
		);
	for (const script of document.getElementsByTagName('script')) {
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
				wait = wait.then(() => p);
			}
			newScript.setAttribute(attr.name, attr.value);
		}
		newScript.dataset.astroExec = '';
		script.replaceWith(newScript);
	}
	return wait;
}
const moveToLocation = (to, from, options, pageTitleForBrowserHistory, historyState) => {
	const intraPage = samePage(from, to);
	const targetPageTitle = document.title;
	document.title = pageTitleForBrowserHistory;
	let scrolledToTop = false;
	if (to.href !== location.href && !historyState) {
		if (options.history === 'replace') {
			const current = history.state;
			history.replaceState(
				{
					...options.state,
					index: current.index,
					scrollX: current.scrollX,
					scrollY: current.scrollY,
				},
				'',
				to.href,
			);
		} else {
			history.pushState(
				{ ...options.state, index: ++currentHistoryIndex, scrollX: 0, scrollY: 0 },
				'',
				to.href,
			);
		}
	}
	document.title = targetPageTitle;
	originalLocation = to;
	if (!intraPage) {
		scrollTo({ left: 0, top: 0, behavior: 'instant' });
		scrolledToTop = true;
	}
	if (historyState) {
		scrollTo(historyState.scrollX, historyState.scrollY);
	} else {
		if (to.hash) {
			history.scrollRestoration = 'auto';
			const savedState = history.state;
			location.href = to.href;
			if (!history.state) {
				history.replaceState(savedState, '');
				if (intraPage) {
					window.dispatchEvent(new PopStateEvent('popstate'));
				}
			}
		} else {
			if (!scrolledToTop) {
				scrollTo({ left: 0, top: 0, behavior: 'instant' });
			}
		}
		history.scrollRestoration = 'manual';
	}
};
function preloadStyleLinks(newDocument) {
	const links = [];
	for (const el of newDocument.querySelectorAll('head link[rel=stylesheet]')) {
		if (
			!document.querySelector(
				`[${PERSIST_ATTR}="${el.getAttribute(
					PERSIST_ATTR,
				)}"], link[rel=stylesheet][href="${el.getAttribute('href')}"]`,
			)
		) {
			const c = document.createElement('link');
			c.setAttribute('rel', 'preload');
			c.setAttribute('as', 'style');
			c.setAttribute('href', el.getAttribute('href'));
			links.push(
				new Promise((resolve) => {
					['load', 'error'].forEach((evName) => c.addEventListener(evName, resolve));
					document.head.append(c);
				}),
			);
		}
	}
	return links;
}
async function updateDOM(preparationEvent, options, currentTransition, historyState, fallback) {
	async function animate(phase) {
		function isInfinite(animation) {
			const effect = animation.effect;
			if (!effect || !(effect instanceof KeyframeEffect) || !effect.target) return false;
			const style = window.getComputedStyle(effect.target, effect.pseudoElement);
			return style.animationIterationCount === 'infinite';
		}
		const currentAnimations = document.getAnimations();
		document.documentElement.setAttribute(OLD_NEW_ATTR, phase);
		const nextAnimations = document.getAnimations();
		const newAnimations = nextAnimations.filter(
			(a) => !currentAnimations.includes(a) && !isInfinite(a),
		);
		return Promise.allSettled(newAnimations.map((a) => a.finished));
	}
	const animateFallbackOld = async () => {
		if (
			fallback === 'animate' &&
			!currentTransition.transitionSkipped &&
			!preparationEvent.signal.aborted
		) {
			try {
				await animate('old');
			} catch {}
		}
	};
	const pageTitleForBrowserHistory = document.title;
	const swapEvent = await doSwap(
		preparationEvent,
		currentTransition.viewTransition,
		animateFallbackOld,
	);
	moveToLocation(swapEvent.to, swapEvent.from, options, pageTitleForBrowserHistory, historyState);
	triggerEvent('astro:after-swap');
	if (fallback === 'animate' && !currentTransition.transitionSkipped && !swapEvent.signal.aborted) {
		animate('new').finally(() => currentTransition.viewTransitionFinished());
	} else {
		currentTransition.viewTransitionFinished?.();
	}
}
function abortAndRecreateMostRecentNavigation() {
	mostRecentNavigation?.controller.abort();
	return (mostRecentNavigation = {
		controller: new AbortController(),
	});
}
async function transition(
	direction,
	from,
	to,
	options,
	historyState,
	hasUAVisualTransition = false,
) {
	const currentNavigation = abortAndRecreateMostRecentNavigation();
	if (!transitionEnabledOnThisPage() || location.origin !== to.origin) {
		if (currentNavigation === mostRecentNavigation) mostRecentNavigation = void 0;
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
	if (samePage(from, to) && !options.formData) {
		if ((direction !== 'back' && to.hash) || (direction === 'back' && from.hash)) {
			moveToLocation(to, from, options, document.title, historyState);
			if (currentNavigation === mostRecentNavigation) mostRecentNavigation = void 0;
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
		currentNavigation.controller.signal,
		options.formData,
		defaultLoader,
	);
	if (prepEvent.defaultPrevented || prepEvent.signal.aborted) {
		if (currentNavigation === mostRecentNavigation) mostRecentNavigation = void 0;
		if (!prepEvent.signal.aborted) {
			location.href = to.href;
		}
		return;
	}
	async function defaultLoader(preparationEvent) {
		const href = preparationEvent.to.href;
		const init = { signal: preparationEvent.signal };
		if (preparationEvent.formData) {
			init.method = 'POST';
			const form =
				preparationEvent.sourceElement instanceof HTMLFormElement
					? preparationEvent.sourceElement
					: preparationEvent.sourceElement instanceof HTMLElement &&
						  'form' in preparationEvent.sourceElement
						? preparationEvent.sourceElement.form
						: preparationEvent.sourceElement?.closest('form');
			init.body =
				from !== void 0 &&
				Reflect.get(HTMLFormElement.prototype, 'attributes', form).getNamedItem('enctype')
					?.value === 'application/x-www-form-urlencoded'
					? new URLSearchParams(preparationEvent.formData)
					: preparationEvent.formData;
		}
		const response = await fetchHTML(href, init);
		if (response === null) {
			preparationEvent.preventDefault();
			return;
		}
		if (response.redirected) {
			const redirectedTo = new URL(response.redirected);
			if (redirectedTo.origin !== preparationEvent.to.origin) {
				preparationEvent.preventDefault();
				return;
			}
			const fragment = preparationEvent.to.hash;
			preparationEvent.to = redirectedTo;
			preparationEvent.to.hash = fragment;
		}
		parser ??= new DOMParser();
		preparationEvent.newDocument = parser.parseFromString(response.html, response.mediaType);
		preparationEvent.newDocument.querySelectorAll('noscript').forEach((el) => el.remove());
		if (
			!preparationEvent.newDocument.querySelector('[name="astro-view-transitions-enabled"]') &&
			!preparationEvent.formData
		) {
			preparationEvent.preventDefault();
			return;
		}
		const links = preloadStyleLinks(preparationEvent.newDocument);
		links.length && !preparationEvent.signal.aborted && (await Promise.all(links));
		if (import.meta.env.DEV && !preparationEvent.signal.aborted)
			await prepareForClientOnlyComponents(
				preparationEvent.newDocument,
				preparationEvent.to,
				preparationEvent.signal,
			);
	}
	async function abortAndRecreateMostRecentTransition() {
		if (mostRecentTransition) {
			if (mostRecentTransition.viewTransition) {
				try {
					mostRecentTransition.viewTransition.skipTransition();
				} catch {}
				try {
					await mostRecentTransition.viewTransition.updateCallbackDone;
				} catch {}
			}
		}
		return (mostRecentTransition = { transitionSkipped: false });
	}
	const currentTransition = await abortAndRecreateMostRecentTransition();
	if (prepEvent.signal.aborted) {
		if (currentNavigation === mostRecentNavigation) mostRecentNavigation = void 0;
		return;
	}
	document.documentElement.setAttribute(DIRECTION_ATTR, prepEvent.direction);
	if (supportsViewTransitions && !hasUAVisualTransition) {
		currentTransition.viewTransition = document.startViewTransition(
			async () => await updateDOM(prepEvent, options, currentTransition, historyState),
		);
	} else {
		const updateDone = (async () => {
			await Promise.resolve();
			await updateDOM(
				prepEvent,
				options,
				currentTransition,
				historyState,
				hasUAVisualTransition ? 'swap' : getFallback(),
			);
			return void 0;
		})();
		currentTransition.viewTransition = {
			updateCallbackDone: updateDone,
			// this is about correct
			ready: updateDone,
			// good enough
			// Finished promise could have been done better: finished rejects iff updateDone does.
			// Our simulation always resolves, never rejects.
			finished: new Promise((r) => (currentTransition.viewTransitionFinished = r)),
			// see end of updateDOM
			skipTransition: () => {
				currentTransition.transitionSkipped = true;
				document.documentElement.removeAttribute(OLD_NEW_ATTR);
			},
			types: /* @__PURE__ */ new Set(),
			// empty by default
		};
	}
	currentTransition.viewTransition?.updateCallbackDone.finally(async () => {
		await runScripts();
		onPageLoad();
		announce();
	});
	currentTransition.viewTransition?.finished.finally(() => {
		currentTransition.viewTransition = void 0;
		if (currentTransition === mostRecentTransition) mostRecentTransition = void 0;
		if (currentNavigation === mostRecentNavigation) mostRecentNavigation = void 0;
		document.documentElement.removeAttribute(DIRECTION_ATTR);
		document.documentElement.removeAttribute(OLD_NEW_ATTR);
	});
	try {
		await currentTransition.viewTransition?.updateCallbackDone;
	} catch (e) {
		const err = e;
		console.log('[astro]', err.name, err.message, err.stack);
	}
}
let navigateOnServerWarned = false;
async function navigate(href, options) {
	if (inBrowser === false) {
		if (!navigateOnServerWarned) {
			const warning = new Error(
				'The view transitions client API was called during a server side render. This may be unintentional as the navigate() function is expected to be called in response to user interactions. Please make sure that your usage is correct.',
			);
			warning.name = 'Warning';
			console.warn(warning);
			navigateOnServerWarned = true;
		}
		return;
	}
	await transition('forward', originalLocation, new URL(href, location.href), options ?? {});
}
function onPopState(ev) {
	if (!transitionEnabledOnThisPage() && ev.state) {
		location.reload();
		return;
	}
	if (ev.state === null) {
		return;
	}
	const state = history.state;
	const nextIndex = state.index;
	const direction = nextIndex > currentHistoryIndex ? 'forward' : 'back';
	currentHistoryIndex = nextIndex;
	transition(
		direction,
		originalLocation,
		new URL(location.href),
		{},
		state,
		ev.hasUAVisualTransition,
	);
}
const onScrollEnd = () => {
	if (history.state && (scrollX !== history.state.scrollX || scrollY !== history.state.scrollY)) {
		updateScrollPosition({ scrollX, scrollY });
	}
};
if (inBrowser) {
	if (supportsViewTransitions || getFallback() !== 'none') {
		originalLocation = new URL(location.href);
		addEventListener('popstate', onPopState);
		addEventListener('load', onPageLoad);
		if ('onscrollend' in window) addEventListener('scrollend', onScrollEnd);
		else {
			let intervalId, lastY, lastX, lastIndex;
			const scrollInterval = () => {
				if (lastIndex !== history.state?.index) {
					clearInterval(intervalId);
					intervalId = void 0;
					return;
				}
				if (lastY === scrollY && lastX === scrollX) {
					clearInterval(intervalId);
					intervalId = void 0;
					onScrollEnd();
					return;
				} else {
					((lastY = scrollY), (lastX = scrollX));
				}
			};
			addEventListener(
				'scroll',
				() => {
					if (intervalId !== void 0) return;
					((lastIndex = history.state?.index), (lastY = scrollY), (lastX = scrollX));
					intervalId = window.setInterval(scrollInterval, 50);
				},
				{ passive: true },
			);
		}
	}
	for (const script of document.getElementsByTagName('script')) {
		detectScriptExecuted(script);
		script.dataset.astroExec = '';
	}
}
async function prepareForClientOnlyComponents(newDocument, toLocation, signal) {
	if (newDocument.body.querySelector(`astro-island[client='only']`)) {
		const nextPage = document.createElement('iframe');
		nextPage.src = toLocation.href;
		nextPage.style.display = 'none';
		document.body.append(nextPage);
		nextPage.contentWindow.console = Object.keys(console).reduce((acc, key) => {
			acc[key] = () => {};
			return acc;
		}, {});
		await hydrationDone(nextPage);
		const nextHead = nextPage.contentDocument?.head;
		if (nextHead) {
			const viteIds = [...nextHead.querySelectorAll(`style[${VITE_ID}]`)].map((style) =>
				style.getAttribute(VITE_ID),
			);
			viteIds.forEach((id) => {
				const style = nextHead.querySelector(`style[${VITE_ID}="${id}"]`);
				if (style && !newDocument.head.querySelector(`style[${VITE_ID}="${id}"]`)) {
					newDocument.head.appendChild(style.cloneNode(true));
				}
			});
		}
		async function hydrationDone(loadingPage) {
			if (!signal.aborted) {
				await new Promise((r) =>
					loadingPage.contentWindow?.addEventListener('load', r, { once: true }),
				);
			}
			return new Promise(async (r) => {
				for (let count = 0; count <= 20; ++count) {
					if (signal.aborted) break;
					if (!loadingPage.contentDocument.body.querySelector('astro-island[ssr]')) break;
					await new Promise((r2) => setTimeout(r2, 50));
				}
				r();
			});
		}
	}
}
export { getFallback, navigate, supportsViewTransitions, transitionEnabledOnThisPage };
