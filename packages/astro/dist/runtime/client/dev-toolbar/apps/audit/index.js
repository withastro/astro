import { settings } from '../../settings.js';
import { positionHighlight } from '../utils/highlight.js';
import { closeOnOutsideClick } from '../utils/window.js';
import { processAnnotations } from './annotations.js';
import { rulesCategories } from './rules/index.js';
import { DevToolbarAuditListItem } from './ui/audit-list-item.js';
import { DevToolbarAuditListWindow } from './ui/audit-list-window.js';
import { createAuditUI } from './ui/audit-ui.js';
const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 1 20 16" aria-hidden="true"><path fill="#fff" d="M.6 2A1.1 1.1 0 0 1 1.7.9h16.6a1.1 1.1 0 1 1 0 2.2H1.6A1.1 1.1 0 0 1 .8 2Zm1.1 7.1h6a1.1 1.1 0 0 0 0-2.2h-6a1.1 1.1 0 0 0 0 2.2ZM9.3 13H1.8a1.1 1.1 0 1 0 0 2.2h7.5a1.1 1.1 0 1 0 0-2.2Zm11.3 1.9a1.1 1.1 0 0 1-1.5 0l-1.7-1.7a4.1 4.1 0 1 1 1.6-1.6l1.6 1.7a1.1 1.1 0 0 1 0 1.6Zm-5.3-3.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"/></svg>';
try {
	customElements.define('astro-dev-toolbar-audit-window', DevToolbarAuditListWindow);
	customElements.define('astro-dev-toolbar-audit-list-item', DevToolbarAuditListItem);
} catch {}
let showState = false;
var audit_default = {
	id: 'astro:audit',
	name: 'Audit',
	icon,
	async init(canvas, eventTarget) {
		let audits = [];
		let auditWindow = document.createElement('astro-dev-toolbar-audit-window');
		let hasCreatedUI = false;
		auditWindow.popover = '';
		canvas.appendChild(auditWindow);
		await run();
		let mutationDebounce;
		const observer = new MutationObserver(() => {
			if (mutationDebounce) {
				clearTimeout(mutationDebounce);
			}
			mutationDebounce = setTimeout(() => {
				settings.logger.verboseLog('Rerunning audit lints because the DOM has been updated.');
				if ('requestIdleCallback' in window) {
					window.requestIdleCallback(
						async () => {
							run().then(() => {
								if (showState) createAuditsUI();
							});
						},
						{ timeout: 300 },
					);
				} else {
					setTimeout(async () => {
						run().then(() => {
							if (showState) createAuditsUI();
						});
					}, 150);
				}
			}, 250);
		});
		setupObserver();
		document.addEventListener('astro:before-preparation', () => {
			observer.disconnect();
		});
		document.addEventListener('astro:after-swap', async () => {
			run();
		});
		document.addEventListener('astro:page-load', async () => {
			refreshLintPositions();
			setTimeout(() => {
				setupObserver();
			}, 100);
		});
		eventTarget.addEventListener('app-toggled', (event) => {
			if (event.detail.state === true) {
				showState = true;
				createAuditsUI();
			} else {
				showState = false;
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
		async function run() {
			processAnnotations();
			await lint();
		}
		async function lint() {
			if (audits.length > 0) {
				audits.forEach((audit) => {
					audit.highlight?.remove();
					audit.card?.remove();
				});
				audits = [];
				hasCreatedUI = false;
			}
			const selectorCache = /* @__PURE__ */ new Map();
			for (const ruleCategory of rulesCategories) {
				for (const rule of ruleCategory.rules) {
					const elements =
						selectorCache.get(rule.selector) ?? document.querySelectorAll(rule.selector);
					let matches = [];
					if (typeof rule.match === 'undefined') {
						matches = Array.from(elements);
					} else {
						for (const element of elements) {
							try {
								if (await rule.match(element)) {
									matches.push(element);
								}
							} catch (e) {
								settings.logger.error(`Error while running audit's match function: ${e}`);
							}
						}
					}
					for (const element of matches) {
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
				}),
			);
		}
		async function createAuditProblem(rule, originalElement) {
			const computedStyle = window.getComputedStyle(originalElement);
			const targetedElement = originalElement.children[0] || originalElement;
			if (targetedElement.offsetParent === null || computedStyle.display === 'none') {
				return;
			}
			if (originalElement.nodeName === 'IMG' && !originalElement.complete) {
				await new Promise((resolve) => {
					originalElement.addEventListener('load', () => resolve(), { once: true });
					originalElement.addEventListener('error', () => resolve(), { once: true });
				});
			}
			audits.push({
				auditedElement: originalElement,
				rule,
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
		['scroll', 'resize'].forEach((event) => {
			window.addEventListener(event, refreshLintPositions);
		});
		function setupObserver() {
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		}
	},
};
export { audit_default as default };
