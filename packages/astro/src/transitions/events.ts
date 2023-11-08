import type { Direction } from './types.js';

// The way to go is to add new properties to tie NavigationNavigateOptions;
// but here we need a temporary ;-) solution that works if navigate isn't called
// to augment the data in the automatically generated NavigateEvent
export const navigationHook: {
	sourceElement?: EventTarget | null;
} = {};

export type AstroNavigateExtension = {
	from: URL;
	to: URL;
	direction: string;
	newDocument: Document;
	loader?: () => Promise<void>;
	finallyRun: (action: () => void) => void;
};

export type Preparation = {
	extension: AstroNavigateExtension;
	event: TransitionPrepareEvent;
	run: (event: TransitionPrepareEvent) => Promise<void>;
	navigateOptions?: NavigationNavigateOptions;
	historyState?: any;
};

export const TRANSITION_AFTER_SWAP = 'astro:after-swap';
export const TRANSITION_PAGE_LOAD = 'astro:page-load';

type Events = 'astro:page-load' | 'astro:after-swap';
export const triggerEvent = (name: Events) => document.dispatchEvent(new Event(name));
export const onPageLoad = () => triggerEvent(TRANSITION_PAGE_LOAD);

type Intercept = (options: NavigationInterceptOptions) => void;

/*
 * Simplified replacement for NavigateEvent for browsers that do not support Navigation API
 */
class NavigateEvent extends Event {
	readonly canIntercept = true;
	readonly navigationType: NavigationTypeString;
	readonly info: any;
	readonly intercept: Intercept;

	constructor(navigationType: NavigationTypeString, info: any, intercept: Intercept) {
		super('navigate', { cancelable: true });
		this.navigationType = navigationType;
		this.info = info;
		this.intercept = intercept;

		Object.defineProperties(this, {
			canIntercept: { writable: false, enumerable: true },
			navigationType: { writable: false, enumerable: true },
			info: { writable: false, enumerable: true },
			intercept: { writable: false, enumerable: true },
		});
	}
}

export const TRANSITION_PREPARE = 'navigate';
export class TransitionPrepareEvent extends NavigateEvent {
	readonly astro: AstroNavigateExtension;
	constructor(
		navigationType: NavigationTypeString,
		info: any,
		intercept: Intercept,
		astro: AstroNavigateExtension
	) {
		super(navigationType, info, intercept);
		this.astro = astro;
	}
}

export const isTransitionPrepareEvent = (value: any): value is TransitionPrepareEvent =>
	!!value.astro;

export function definePreparation(
	from: URL,
	to: URL,
	direction: Direction,
	navigateOptions?: NavigationNavigateOptions,
	historyState?: any
): Preparation {
	const final = [] as (() => void)[];
	return {
		extension: {
			from,
			to,
			direction,
			newDocument: window.document,
			finallyRun(action: () => void) {
				final.push(action);
			},
		} as AstroNavigateExtension,
		event: undefined as unknown as TransitionPrepareEvent,
		async run(event: TransitionPrepareEvent) {
			try {
				const loader = this.extension.loader;
				if (loader) {
					await loader();
				}
				final.map((action) => action());
			} catch (err) {
				event.preventDefault();
				throw err;
			}
		},
		navigateOptions,
		historyState,
	};
}

/*
 * TransitionBeforeSwapEvent
 */

export const TRANSITION_BEFORE_SWAP = 'astro:before-swap';
export class TransitionBeforeSwapEvent extends Event {
	from: URL;
	to: URL;
	direction: string;
	newDocument: Document;
	navigationType: NavigationTypeString;
	info: any;
	viewTransition: ViewTransition;
	swap: () => void;

	constructor(
		astro: AstroNavigateExtension,
		navigationType: NavigationTypeString,
		info: any,
		viewTransition: ViewTransition,
		defaultSwap: (beforeSwapEvent: TransitionBeforeSwapEvent) => void
	) {
		super(TRANSITION_BEFORE_SWAP);
		this.from = astro.from;
		this.to = astro.to;
		this.direction = astro.direction;
		this.newDocument = astro.newDocument;
		this.navigationType = navigationType;
		this.info = info;
		this.viewTransition = viewTransition;
		this.swap = defaultSwap.bind(null, this);
	}
}
export const isTransitionBeforeSwapEvent = (value: any): value is TransitionBeforeSwapEvent =>
	value.type === TRANSITION_BEFORE_SWAP;

export async function doSwap(
	prepareEvent: TransitionPrepareEvent,
	viewTransition: ViewTransition,
	defaultSwap: (beforeSwapEvent: TransitionBeforeSwapEvent) => void
) {
	const astro = prepareEvent.astro;
	const event = new TransitionBeforeSwapEvent(
		astro,
		prepareEvent.navigationType,
		prepareEvent.info,
		viewTransition,
		defaultSwap
	);

	// say "hello" to all listeners

	document.dispatchEvent(event);
	await event.swap();
	return event;
}
