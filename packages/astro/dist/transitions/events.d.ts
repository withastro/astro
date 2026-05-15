import type { Direction, NavigationTypeString } from './types.js';
/** @deprecated This will be removed in Astro 7 */
export declare const TRANSITION_BEFORE_PREPARATION = 'astro:before-preparation';
/** @deprecated This will be removed in Astro 7 */
export declare const TRANSITION_AFTER_PREPARATION = 'astro:after-preparation';
/** @deprecated This will be removed in Astro 7 */
export declare const TRANSITION_BEFORE_SWAP = 'astro:before-swap';
/** @deprecated This will be removed in Astro 7 */
export declare const TRANSITION_AFTER_SWAP = 'astro:after-swap';
/** @deprecated This will be removed in Astro 7 */
export declare const TRANSITION_PAGE_LOAD = 'astro:page-load';
type Events = 'astro:after-preparation' | 'astro:after-swap' | 'astro:page-load';
export declare const triggerEvent: (name: Events) => boolean;
export declare const onPageLoad: () => boolean;
declare class BeforeEvent extends Event {
	readonly from: URL;
	to: URL;
	direction: Direction | string;
	readonly navigationType: NavigationTypeString;
	readonly sourceElement: Element | undefined;
	readonly info: any;
	newDocument: Document;
	readonly signal: AbortSignal;
	constructor(
		type: string,
		eventInitDict: EventInit | undefined,
		from: URL,
		to: URL,
		direction: Direction | string,
		navigationType: NavigationTypeString,
		sourceElement: Element | undefined,
		info: any,
		newDocument: Document,
		signal: AbortSignal,
	);
}
/** @deprecated This will be removed in Astro 7 */
export declare const isTransitionBeforePreparationEvent: (
	value: any,
) => value is TransitionBeforePreparationEvent;
export declare class TransitionBeforePreparationEvent extends BeforeEvent {
	formData: FormData | undefined;
	loader: () => Promise<void>;
	constructor(
		from: URL,
		to: URL,
		direction: Direction | string,
		navigationType: NavigationTypeString,
		sourceElement: Element | undefined,
		info: any,
		newDocument: Document,
		signal: AbortSignal,
		formData: FormData | undefined,
		loader: (event: TransitionBeforePreparationEvent) => Promise<void>,
	);
}
/** @deprecated This will be removed in Astro 7 */
export declare const isTransitionBeforeSwapEvent: (
	value: any,
) => value is TransitionBeforeSwapEvent;
export declare class TransitionBeforeSwapEvent extends BeforeEvent {
	readonly direction: Direction | string;
	readonly viewTransition: ViewTransition;
	swap: () => void;
	constructor(afterPreparation: BeforeEvent, viewTransition: ViewTransition);
}
export declare function doPreparation(
	from: URL,
	to: URL,
	direction: Direction | string,
	navigationType: NavigationTypeString,
	sourceElement: Element | undefined,
	info: any,
	signal: AbortSignal,
	formData: FormData | undefined,
	defaultLoader: (event: TransitionBeforePreparationEvent) => Promise<void>,
): Promise<TransitionBeforePreparationEvent>;
export declare const updateScrollPosition: (positions: {
	scrollX: number;
	scrollY: number;
}) => void;
export declare function doSwap(
	afterPreparation: BeforeEvent,
	viewTransition: ViewTransition,
	afterDispatch?: () => Promise<void>,
): Promise<TransitionBeforeSwapEvent>;
export {};
