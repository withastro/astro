import type { Audit } from '../index.js';
import type { DevToolbarAuditListItem } from './audit-list-item.js';
export declare function createAuditUI(
	audit: Audit,
	audits: Audit[],
): {
	highlight: import('../../../ui-library/highlight.js').DevToolbarHighlight;
	card: DevToolbarAuditListItem;
};
