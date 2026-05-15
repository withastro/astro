export declare const placements: readonly ['bottom-left', 'bottom-center', 'bottom-right'];
export type Placement = (typeof placements)[number];
export declare function isValidPlacement(value: string): value is Placement;
export declare class DevToolbarWindow extends HTMLElement {
	shadowRoot: ShadowRoot;
	_placement: Placement;
	get placement(): 'bottom-left' | 'bottom-center' | 'bottom-right';
	set placement(value: 'bottom-left' | 'bottom-center' | 'bottom-right');
	static observedAttributes: string[];
	constructor();
	connectedCallback(): Promise<void>;
	attributeChangedCallback(): void;
	updateStyle(): void;
}
