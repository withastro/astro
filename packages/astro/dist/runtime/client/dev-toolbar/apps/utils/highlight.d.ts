import type { DevToolbarHighlight } from '../../ui-library/highlight.js';
import type { Icon } from '../../ui-library/icons.js';
export declare function createHighlight(
	rect: DOMRect,
	icon?: Icon,
	additionalAttributes?: Record<string, string>,
): DevToolbarHighlight;
export declare function getElementsPositionInDocument(el: Element): {
	isFixed: boolean;
};
export declare function positionHighlight(highlight: DevToolbarHighlight, rect: DOMRect): void;
export declare function attachTooltipToHighlight(
	highlight: DevToolbarHighlight,
	tooltip: HTMLElement,
	originalElement: Element,
): void;
