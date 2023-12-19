import { updateScrollPosition } from './router.js';
import type { Direction, NavigationTypeString } from './types.js';

export const TRANSITION_BEFORE_PREPARATION = 'astro:before-preparation';
export const TRANSITION_AFTER_PREPARATION = 'astro:after-preparation';
export const TRANSITION_BEFORE_SWAP = 'astro:before-swap';
export const TRANSITION_AFTER_SWAP = 'astro:after-swap';
export const TRANSITION_PAGE_LOAD = 'astro:page-load';

type Events =
	| typeof TRANSITION_AFTER_PREPARATION
	| typeof TRANSITION_AFTER_SWAP
	| typeof TRANSITION_PAGE_LOAD;
export const triggerEvent = (name: Events) => document.dispatchEvent(new Event(name));
export const onPageLoad = () => triggerEvent(TRANSITION_PAGE_LOAD);

/*
 * Common stuff
 */
class BeforeEvent extends Event {
	readonly from: URL;
	to: URL;
	direction: Direction | string;
	readonly navigationType: NavigationTypeString;
	readonly sourceElement: Element | undefined;
	readonly info: any;
	newDocument: Document;

	constructor(
		type: string,
		eventInitDict: EventInit | undefined,
		from: URL,
		to: URL,
		direction: Direction | string,
		navigationType: NavigationTypeString,
		sourceElement: Element | undefined,
		info: any,
		newDocument: Document
	) {
		super(type, eventInitDict);
		this.from = from;
		this.to = to;
		this.direction = direction;
		this.navigationType = navigationType;
		this.sourceElement = sourceElement;
		this.info = info;
		this.newDocument = newDocument;

		Object.defineProperties(this, {
			from: { enumerable: true },
			to: { enumerable: true, writable: true },
			direction: { enumerable: true, writable: true },
			navigationType: { enumerable: true },
			sourceElement: { enumerable: true },
			info: { enumerable: true },
			newDocument: { enumerable: true, writable: true },
		});
	}
}

/*
 * TransitionBeforePreparationEvent

 */
export const isTransitionBeforePreparationEvent = (
	value: any
): value is TransitionBeforePreparationEvent => value.type === TRANSITION_BEFORE_PREPARATION;
export class TransitionBeforePreparationEvent extends BeforeEvent {
	body: FormData | URLSearchParams | undefined;
	loader: () => Promise<void>;
	constructor(
		from: URL,
		to: URL,
		direction: Direction | string,
		navigationType: NavigationTypeString,
		sourceElement: Element | undefined,
		info: any,
		newDocument: Document,
		body: FormData | URLSearchParams | undefined,
		loader: (event: TransitionBeforePreparationEvent) => Promise<void>
	) {
		super(
			TRANSITION_BEFORE_PREPARATION,
			{ cancelable: true },
			from,
			to,
			direction,
			navigationType,
			sourceElement,
			info,
			newDocument
		);
		this.body = body;
		this.loader = loader.bind(this, this);
		Object.defineProperties(this, {
			formData: { enumerable: true },
			loader: { enumerable: true, writable: true },
		});
	}
}

/*
 * TransitionBeforeSwapEvent
 */

export const isTransitionBeforeSwapEvent = (value: any): value is TransitionBeforeSwapEvent =>
	value.type === TRANSITION_BEFORE_SWAP;
export class TransitionBeforeSwapEvent extends BeforeEvent {
	readonly direction: Direction | string;
	readonly viewTransition: ViewTransition;
	swap: () => void;

	constructor(
		afterPreparation: BeforeEvent,
		viewTransition: ViewTransition,
		swap: (event: TransitionBeforeSwapEvent) => void
	) {
		super(
			TRANSITION_BEFORE_SWAP,
			undefined,
			afterPreparation.from,
			afterPreparation.to,
			afterPreparation.direction,
			afterPreparation.navigationType,
			afterPreparation.sourceElement,
			afterPreparation.info,
			afterPreparation.newDocument
		);
		this.direction = afterPreparation.direction;
		this.viewTransition = viewTransition;
		this.swap = swap.bind(this, this);

		Object.defineProperties(this, {
			direction: { enumerable: true },
			viewTransition: { enumerable: true },
			swap: { enumerable: true, writable: true },
		});
	}
}

export async function doPreparation(
	from: URL,
	to: URL,
	direction: Direction | string,
	navigationType: NavigationTypeString,
	sourceElement: Element | undefined,
	info: any,
	body: FormData | URLSearchParams | undefined,
	defaultLoader: (event: TransitionBeforePreparationEvent) => Promise<void>
) {
	const event = new TransitionBeforePreparationEvent(
		from,
		to,
		direction,
		navigationType,
		sourceElement,
		info,
		window.document,
		body,
		defaultLoader
	);
	if (document.dispatchEvent(event)) {
		await event.loader();
		if (!event.defaultPrevented) {
			triggerEvent(TRANSITION_AFTER_PREPARATION);
			if (event.navigationType !== 'traverse') {
				// save the current scroll position before we change the DOM and transition to the new page
				updateScrollPosition({ scrollX, scrollY });
			}
		}
	}
	return event;
}

export async function doSwap(
	afterPreparation: BeforeEvent,
	viewTransition: ViewTransition,
	defaultSwap: (event: TransitionBeforeSwapEvent) => void
) {
	const event = new TransitionBeforeSwapEvent(afterPreparation, viewTransition, defaultSwap);
	document.dispatchEvent(event);
	event.swap();
	return event;
}
