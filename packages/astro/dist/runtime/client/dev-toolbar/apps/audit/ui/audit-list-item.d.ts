export declare class DevToolbarAuditListItem extends HTMLElement {
	clickAction?: () => void | (() => Promise<void>);
	shadowRoot: ShadowRoot;
	isManualFocus: boolean;
	constructor();
	connectedCallback(): void;
}
