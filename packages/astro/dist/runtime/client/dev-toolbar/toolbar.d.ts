import type { ResolvedDevToolbarApp as DevToolbarAppDefinition } from '../../../types/public/toolbar.js';
import { type ToolbarAppEventTarget } from './helpers.js';
import { type Icon } from './ui-library/icons.js';
import type { Placement } from './ui-library/window.js';
export type DevToolbarApp = DevToolbarAppDefinition & {
	builtIn: boolean;
	active: boolean;
	status: 'ready' | 'loading' | 'error';
	notification: {
		state: boolean;
		level?: 'error' | 'warning' | 'info';
	};
	eventTarget: ToolbarAppEventTarget;
};
export declare class AstroDevToolbar extends HTMLElement {
	shadowRoot: ShadowRoot;
	delayedHideTimeout: number | undefined;
	devToolbarContainer: HTMLDivElement | undefined;
	apps: DevToolbarApp[];
	hasBeenInitialized: boolean;
	customAppsToShow: number;
	constructor();
	/**
	 * All one-time DOM setup runs through here. Only ever call this once,
	 * in connectedCallback(), and protect it from being called again.
	 */
	init(): void;
	connectedCallback(): void;
	attachEvents(): void;
	initApp(app: DevToolbarApp): Promise<void>;
	getAppTemplate(app: DevToolbarApp): string;
	getAppById(id: string): DevToolbarApp | undefined;
	getAppCanvasById(id: string): HTMLElement | null;
	getAppButtonById(id: string): HTMLElement | null;
	toggleAppStatus(app: DevToolbarApp): Promise<void>;
	setAppStatus(app: DevToolbarApp, newStatus: boolean): Promise<boolean>;
	isHidden(): boolean;
	getActiveApp(): DevToolbarApp | undefined;
	clearDelayedHide(): void;
	triggerDelayedHide(): void;
	setToolbarVisible(newStatus: boolean): void;
	setNotificationVisible(newStatus: boolean): void;
	setToolbarPlacement(newPlacement: Placement): void;
}
export declare class DevToolbarCanvas extends HTMLElement {
	shadowRoot: ShadowRoot;
	constructor();
	connectedCallback(): void;
}
export declare function getAppIcon(icon: Icon): string;
