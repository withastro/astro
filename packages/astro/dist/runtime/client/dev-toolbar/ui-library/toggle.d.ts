declare const styles: readonly ['purple', 'gray', 'red', 'green', 'yellow', 'blue'];
type ToggleStyle = (typeof styles)[number];
export declare class DevToolbarToggle extends HTMLElement {
	shadowRoot: ShadowRoot;
	input: HTMLInputElement;
	_toggleStyle: ToggleStyle;
	get toggleStyle(): 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple';
	set toggleStyle(value: 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple');
	static observedAttributes: string[];
	constructor();
	attributeChangedCallback(): void;
	updateStyle(): void;
	connectedCallback(): void;
	get value(): string;
	set value(val: string);
}
export {};
