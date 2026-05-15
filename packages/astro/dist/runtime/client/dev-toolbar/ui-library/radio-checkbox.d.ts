export declare class DevToolbarRadioCheckbox extends HTMLElement {
	private _radioStyle;
	input: HTMLInputElement;
	shadowRoot: ShadowRoot;
	get radioStyle(): 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple';
	set radioStyle(value: 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple');
	static observedAttributes: string[];
	constructor();
	connectedCallback(): void;
	updateStyle(): void;
	updateInputState(): void;
	attributeChangedCallback(): void;
}
