import type { DevToolbarApp } from '../../../../../@types/astro.js';
import type { DevToolbarHighlight } from '../../ui-library/highlight.js';
import { positionHighlight } from '../utils/highlight.js';
import { closeOnOutsideClick } from '../utils/window.js';
import { rulesCategories, type AuditRule } from './rules/index.js';
import { DevToolbarAuditListItem } from './ui/audit-list-item.js';
import { DevToolbarAuditListWindow } from './ui/audit-list-window.js';
import { createAuditUI } from './ui/audit-ui.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 1 20 16"><path fill="#fff" d="M.6 2A1.1 1.1 0 0 1 1.7.9h16.6a1.1 1.1 0 1 1 0 2.2H1.6A1.1 1.1 0 0 1 .8 2Zm1.1 7.1h6a1.1 1.1 0 0 0 0-2.2h-6a1.1 1.1 0 0 0 0 2.2ZM9.3 13H1.8a1.1 1.1 0 1 0 0 2.2h7.5a1.1 1.1 0 1 0 0-2.2Zm11.3 1.9a1.1 1.1 0 0 1-1.5 0l-1.7-1.7a4.1 4.1 0 1 1 1.6-1.6l1.6 1.7a1.1 1.1 0 0 1 0 1.6Zm-5.3-3.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"/></svg>';

export type Audit = {
	auditedElement: HTMLElement;
	rule: AuditRule;
	highlight: DevToolbarHighlight | null;
	card: HTMLElement | null;
};

try {
	customElements.define('astro-dev-toolbar-audit-window', DevToolbarAuditListWindow);
	customElements.define('astro-dev-toolbar-audit-list-item', DevToolbarAuditListItem);
} catch (e) {}

export default {
	id: 'astro:audit',
	name: 'Audit',
	icon: icon,
	async init(canvas, eventTarget) {
		let audits: Audit[] = [];
		let auditWindow = document.createElement(
			'astro-dev-toolbar-audit-window'
		) as DevToolbarAuditListWindow;
		let hasCreatedUI = false;

		canvas.appendChild(auditWindow);

		await lint();

		document.addEventListener('astro:after-swap', async () => lint());
		document.addEventListener('astro:page-load', async () => refreshLintPositions);

		eventTarget.addEventListener('app-toggled', (event: any) => {
			if (event.detail.state === true) {
				createAuditsUI();
			}
		});

		closeOnOutsideClick(eventTarget, () => {
			const activeAudits = audits.filter((audit) => audit.card?.hasAttribute('active'));

			if (activeAudits.length > 0) {
				activeAudits.forEach((audit) => {
					audit.card?.toggleAttribute('active', false);
				});
				return true;
			}

			return false;
		});

		async function createAuditsUI() {
			if (hasCreatedUI) return;

			const fragment = document.createDocumentFragment();
			for (const audit of audits) {
				const { card, highlight } = createAuditUI(audit, audits);
				audit.card = card;
				audit.highlight = highlight;
				fragment.appendChild(highlight);
			}

			auditWindow.audits = audits;
			canvas.appendChild(fragment);

			hasCreatedUI = true;
		}

		async function lint() {
			// Clear the previous audits
			if (audits.length > 0) {
				audits = [];
				audits.forEach((audit) => {
					audit.highlight?.remove();
					audit.card?.remove();
				});
			}

			const selectorCache = new Map<string, NodeListOf<Element>>();
			for (const ruleCategory of rulesCategories) {
				for (const rule of ruleCategory.rules) {
					const elements =
						selectorCache.get(rule.selector) ?? document.querySelectorAll(rule.selector);
					let matches: Element[] = [];
					if (typeof rule.match === 'undefined') {
						matches = Array.from(elements);
					} else {
						for (const element of elements) {
							try {
								if (await rule.match(element)) {
									matches.push(element);
								}
							} catch (e) {
								console.error("Error while running audit's match function", e);
							}
						}
					}
					for (const element of matches) {
						// Don't audit elements that already have an audit on them
						// TODO: This is a naive implementation, it'd be good to show all the audits for an element at the same time.
						if (audits.some((audit) => audit.auditedElement === element)) continue;

						await createAuditProblem(rule, element);
					}
				}
			}

			eventTarget.dispatchEvent(
				new CustomEvent('toggle-notification', {
					detail: {
						state: audits.length > 0,
					},
				})
			);
		}

		async function createAuditProblem(rule: AuditRule, originalElement: Element) {
			const computedStyle = window.getComputedStyle(originalElement);
			const targetedElement = (originalElement.children[0] as HTMLElement) || originalElement;

			// If the element is hidden, don't do anything
			if (targetedElement.offsetParent === null || computedStyle.display === 'none') {
				return;
			}

			// If the element is an image but not yet loaded, ignore it
			// TODO: We shouldn't ignore this, because it is valid for an image to not be loaded at start (e.g. lazy loading)
			if (originalElement.nodeName === 'IMG' && !(originalElement as HTMLImageElement).complete) {
				return;
			}

			audits.push({
				auditedElement: originalElement as HTMLElement,
				rule: rule,
				card: null,
				highlight: null,
			});
		}

		function refreshLintPositions() {
			audits.forEach(({ highlight, auditedElement }) => {
				const rect = auditedElement.getBoundingClientRect();
				if (highlight) positionHighlight(highlight, rect);
			});
		}

		(['scroll', 'resize'] as const).forEach((event) => {
			window.addEventListener(event, refreshLintPositions);
		});
	},
} satisfies DevToolbarApp;
