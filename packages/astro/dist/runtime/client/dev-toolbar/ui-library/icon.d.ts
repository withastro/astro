import { type Icon } from './icons.js';
export declare class DevToolbarIcon extends HTMLElement {
	_icon: Icon | undefined;
	shadowRoot: ShadowRoot;
	get icon(): Icon | undefined;
	set icon(name: Icon | undefined);
	constructor();
	getIconHTML(icon: Icon | undefined): string;
	buildTemplate(): void;
}
