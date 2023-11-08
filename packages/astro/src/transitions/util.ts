import type { Fallback } from './types.js';

export const inBrowser = import.meta.env.SSR === false;

export const supportsViewTransitions = inBrowser && !!document.startViewTransition;
export const supportsNavigationAPI = inBrowser && window.navigation?.currentEntry?.getState && true; // not yet

export const transitionEnabledOnThisPage = () =>
	inBrowser && !!document.querySelector('[name="astro-view-transitions-enabled"]');

export const allowIntraPageTransitions = () =>
	inBrowser && !!document.querySelector('[name="astro-view-transitions-intra-page"]');

// The History API does not tell you if navigation is forward or back, so
// you can figure it using an index. On pushState the index is incremented so you
// can use that to determine popstate if going forward or back.
export let currentHistoryIndex = 0;
export const setCurrentHistoryIndex = (index: number) => (currentHistoryIndex = index);

export const getFallback = (): Fallback => {
	const el = document.querySelector('[name="astro-view-transitions-fallback"]');
	if (el) {
		return el.getAttribute('content') as Fallback;
	}
	return 'animate';
};
