import type { Icon } from '../../../ui-library/icons.js';
import type { Audit } from '../index.js';
export declare function createRoundedBadge(icon: Icon): {
	badge: import('../../../ui-library/badge.js').DevToolbarBadge;
	updateCount: (count: number) => void;
};
export declare class DevToolbarAuditListWindow extends HTMLElement {
	_audits: Audit[];
	shadowRoot: ShadowRoot;
	badges: {
		[key: string]: {
			badge: HTMLElement;
			updateCount: (count: number) => void;
		};
	};
	get audits(): Audit[];
	set audits(value: Audit[]);
	constructor();
	connectedCallback(): void;
	updateAuditList(): void;
	updateBadgeCounts(): void;
	render(): void;
}
