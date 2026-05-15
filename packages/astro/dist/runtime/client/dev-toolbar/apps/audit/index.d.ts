import type { DevToolbarHighlight } from '../../ui-library/highlight.js';
import { type AuditRule } from './rules/index.js';
export type Audit = {
	auditedElement: HTMLElement;
	rule: AuditRule;
	highlight: DevToolbarHighlight | null;
	card: HTMLElement | null;
};
declare const _default: {
	id: string;
	name: string;
	icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 1 20 16" aria-hidden="true"><path fill="#fff" d="M.6 2A1.1 1.1 0 0 1 1.7.9h16.6a1.1 1.1 0 1 1 0 2.2H1.6A1.1 1.1 0 0 1 .8 2Zm1.1 7.1h6a1.1 1.1 0 0 0 0-2.2h-6a1.1 1.1 0 0 0 0 2.2ZM9.3 13H1.8a1.1 1.1 0 1 0 0 2.2h7.5a1.1 1.1 0 1 0 0-2.2Zm11.3 1.9a1.1 1.1 0 0 1-1.5 0l-1.7-1.7a4.1 4.1 0 1 1 1.6-1.6l1.6 1.7a1.1 1.1 0 0 1 0 1.6Zm-5.3-3.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"/></svg>';
	init(
		canvas: ShadowRoot,
		eventTarget: import('../../helpers.js').ToolbarAppEventTarget,
	): Promise<void>;
};
export default _default;
