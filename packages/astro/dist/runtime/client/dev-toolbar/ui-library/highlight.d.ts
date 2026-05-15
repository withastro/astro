import { type Icon } from './icons.js';
declare const styles: readonly ['purple', 'gray', 'red', 'green', 'yellow', 'blue'];
type HighlightStyle = (typeof styles)[number];
export declare class DevToolbarHighlight extends HTMLElement {
	icon?: Icon | undefined | null;
	_highlightStyle: HighlightStyle;
	get highlightStyle(): 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple';
	set highlightStyle(value: 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'purple');
	static observedAttributes: string[];
	shadowRoot: ShadowRoot;
	constructor();
	updateStyle(): void;
	attributeChangedCallback(): void;
	connectedCallback(): void;
}
export {};
