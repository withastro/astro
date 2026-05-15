declare const styles: readonly ['purple', 'gray', 'red', 'green', 'yellow', 'blue'];
type SelectStyle = (typeof styles)[number];
export declare class DevToolbarSelect extends HTMLElement {
	shadowRoot: ShadowRoot;
	element: HTMLSelectElement;
	_selectStyle: SelectStyle;
	get selectStyle(): 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple';
	set selectStyle(value: 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple');
	static observedAttributes: string[];
	constructor();
	connectedCallback(): void;
	attributeChangedCallback(): void;
	updateStyle(): void;
}
export {};
