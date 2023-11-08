import {
	definePreparation,
	isTransitionPrepareEvent,
	navigationHook,
	TransitionPrepareEvent,
} from './events.js';
import { defaultLoader, onNavigateCore, originalLocation } from './router.js';
import type { Direction } from './types.js';
import {
	currentHistoryIndex,
	setCurrentHistoryIndex,
	transitionEnabledOnThisPage,
} from './util.js';

// If this gets called we are on a browser that supports the Navigation API
// and we decided to use it

export function onNavigate(prepareEvent: NavigateEvent) {
	let direction: Direction = 'forward';

	// As of Nov 2023, sourceElement has not yet made it into the spec: https://github.com/w3ctag/design-reviews/issues/867
	(prepareEvent as any).sourceElement ??= navigationHook.sourceElement;

	const link = (prepareEvent as any).sourceElement;
	// Let's first look at the main case: The user has clicked on a link
	if (
		(prepareEvent.navigationType === 'push' && !link) ||
		!(link instanceof HTMLAnchorElement) ||
		link.dataset.astroReload !== undefined ||
		link.hasAttribute('download') ||
		!link.href ||
		(link.target && link.target !== '_self') || // should not generate NavigateEvent
		!transitionEnabledOnThisPage() ||
		link.origin !== location.origin || // should not generate NavigateEvent can we drop this?
		prepareEvent.defaultPrevented ||
		!prepareEvent.canIntercept
	) {
		// let some one else handle this
		return;
	}
	// Forms are not yet supported
	if ((prepareEvent as any).sourceElement instanceof HTMLFormElement) {
		return;
	}
	// this one is for history navigation with the back/forward buttons,
	// but also when back() / forward() is called
	if (prepareEvent.navigationType === 'traverse') {
		const state: any = window.navigation.currentEntry?.getState();
		const nextIndex = state.index;
		const nextIndex2 = window.navigation.currentEntry?.index;
		console.log('nextIndex, nextIndex2 :>> ', nextIndex, nextIndex2);
		direction = nextIndex > currentHistoryIndex ? 'forward' : 'back';
		setCurrentHistoryIndex(nextIndex);
		console.log(direction, currentHistoryIndex);
	}

	const preparation = definePreparation(
		originalLocation,
		new URL(prepareEvent.destination.url, location.href),
		direction
	);
	console.log('preparation :>> ', preparation);
	(prepareEvent as any).astro = preparation.extension;
	console.log('(prepareEvent as any).astro :>> ', (prepareEvent as any).astro);

	// keep typescript happy
	if (isTransitionPrepareEvent(prepareEvent)) {
		preparation.event = prepareEvent as any as TransitionPrepareEvent;
		console.log('preparation.event :>> ', preparation.event);
		preparation.extension.loader = defaultLoader.bind(null, prepareEvent);
		console.log('preparation.extension.loader :>> ', preparation.extension.loader);
		onNavigateCore(prepareEvent, preparation);
	}
}
