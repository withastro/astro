export declare function createWindowElement(
	content: string,
	placement?: 'bottom-left' | 'bottom-center' | 'bottom-right',
): import('../../ui-library/window.js').DevToolbarWindow;
export declare function closeOnOutsideClick(
	eventTarget: EventTarget,
	additionalCheck?: (target: Element) => boolean,
): void;
export declare function synchronizePlacementOnUpdate(
	eventTarget: EventTarget,
	canvas: ShadowRoot,
): void;
