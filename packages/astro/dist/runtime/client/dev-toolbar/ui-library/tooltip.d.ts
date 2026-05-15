import { type Icon } from './icons.js';
export interface DevToolbarTooltipSection {
	title?: string;
	inlineTitle?: string;
	icon?: Icon;
	content?: string;
	clickAction?: () => void | Promise<void>;
	clickDescription?: string;
}
export declare class DevToolbarTooltip extends HTMLElement {
	sections: DevToolbarTooltipSection[];
	shadowRoot: ShadowRoot;
	constructor();
	connectedCallback(): void;
	getElementForIcon(icon: Icon | (string & NonNullable<unknown>)): string;
}
