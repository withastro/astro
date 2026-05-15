declare const sizes: readonly ['small', 'medium', 'large'];
declare const styles: readonly [
	'ghost',
	'outline',
	'purple',
	'gray',
	'red',
	'green',
	'yellow',
	'blue',
];
declare const borderRadii: readonly ['normal', 'rounded'];
type ButtonSize = (typeof sizes)[number];
type ButtonStyle = (typeof styles)[number];
type ButtonBorderRadius = (typeof borderRadii)[number];
export declare class DevToolbarButton extends HTMLElement {
	_size: ButtonSize;
	_buttonStyle: ButtonStyle;
	_buttonBorderRadius: ButtonBorderRadius;
	get size(): 'small' | 'large' | 'medium';
	set size(value: 'small' | 'large' | 'medium');
	get buttonStyle(): 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple' | 'ghost' | 'outline';
	set buttonStyle(
		value: 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple' | 'ghost' | 'outline',
	);
	get buttonBorderRadius(): 'normal' | 'rounded';
	set buttonBorderRadius(value: 'normal' | 'rounded');
	static observedAttributes: string[];
	shadowRoot: ShadowRoot;
	constructor();
	connectedCallback(): void;
	updateStyle(): void;
	attributeChangedCallback(): void;
}
export {};
