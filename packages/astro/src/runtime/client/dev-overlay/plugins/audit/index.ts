import type { DevOverlayMetadata, DevOverlayPlugin } from '../../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../../ui-library/highlight.js';
import {
	attachTooltipToHighlight,
	createHighlight,
	getElementsPositionInDocument,
	positionHighlight,
} from '../utils/highlight.js';
import { createWindowElement } from '../utils/window.js';
import { a11y } from './a11y.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 1 20 16"><path fill="#fff" d="M.6 2A1.1 1.1 0 0 1 1.7.9h16.6a1.1 1.1 0 1 1 0 2.2H1.6A1.1 1.1 0 0 1 .8 2Zm1.1 7.1h6a1.1 1.1 0 0 0 0-2.2h-6a1.1 1.1 0 0 0 0 2.2ZM9.3 13H1.8a1.1 1.1 0 1 0 0 2.2h7.5a1.1 1.1 0 1 0 0-2.2Zm11.3 1.9a1.1 1.1 0 0 1-1.5 0l-1.7-1.7a4.1 4.1 0 1 1 1.6-1.6l1.6 1.7a1.1 1.1 0 0 1 0 1.6Zm-5.3-3.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"/></svg>';

type DynamicString = string | ((element: Element) => string);

export interface AuditRule {
	code: string;
	title: DynamicString;
	message: DynamicString;
}

export interface ResolvedAuditRule {
	code: string;
	title: string;
	message: string;
}

export interface AuditRuleWithSelector extends AuditRule {
	selector: string;
	match?: (element: Element) => boolean | null | undefined | void;
}

const rules = [...a11y];

const dynamicAuditRuleKeys: Array<keyof AuditRule> = ['title', 'message'];
function resolveAuditRule(rule: AuditRule, element: Element): ResolvedAuditRule {
	let resolved: ResolvedAuditRule = { ...rule } as any;
	for (const key of dynamicAuditRuleKeys) {
		const value = rule[key];
		if (typeof value === 'string') continue;
		resolved[key] = value(element);
	}
	return resolved;
}

export default {
	id: 'astro:audit',
	name: 'Audit',
	icon: icon,
	async init(canvas, eventTarget) {
		let audits: { highlightElement: DevOverlayHighlight; auditedElement: HTMLElement }[] = [];

		await lint();

		document.addEventListener('astro:after-swap', async () => lint());
		document.addEventListener('astro:page-load', async () => refreshLintPositions);

		function onPageClick(event: MouseEvent) {
			const target = event.target as Element | null;
			if (!target) return;
			if (!target.closest) return;
			if (target.closest('astro-dev-toolbar')) return;
			eventTarget.dispatchEvent(
				new CustomEvent('toggle-plugin', {
					detail: {
						state: false,
					},
				})
			);
		}
		eventTarget.addEventListener('app-toggled', (event: any) => {
			if (event.detail.state === true) {
				document.addEventListener('click', onPageClick, true);
			} else {
				document.removeEventListener('click', onPageClick, true);
			}
		});

		async function lint() {
			audits.forEach(({ highlightElement }) => {
				highlightElement.remove();
			});
			audits = [];
			canvas.getElementById('no-audit')?.remove();
			const selectorCache = new Map<string, NodeListOf<Element>>();

			for (const rule of rules) {
				const elements =
					selectorCache.get(rule.selector) ?? document.querySelectorAll(rule.selector);
				let matches: Element[] = [];
				if (typeof rule.match === 'undefined') {
					matches = Array.from(elements);
				} else {
					for (const element of elements) {
						if (rule.match(element)) {
							matches.push(element);
						}
					}
				}
				for (const element of matches) {
					await createAuditProblem(rule, element);
				}
			}

			if (audits.length > 0) {
				eventTarget.dispatchEvent(
					new CustomEvent('toggle-notification', {
						detail: {
							state: true,
						},
					})
				);
			} else {
				eventTarget.dispatchEvent(
					new CustomEvent('toggle-notification', {
						detail: {
							state: false,
						},
					})
				);

				const window = createWindowElement(
					`<style>
						header {
							display: flex;
						}

						h1 {
							display: flex;
							align-items: center;
							gap: 8px;
							font-weight: 600;
							color: #fff;
							margin: 0;
							font-size: 22px;
						}

						astro-dev-toolbar-icon {
							width: 1em;
						   height: 1em;
						   padding: 8px;
							display: block;
							background: green;
							border-radius: 9999px;
						}
					</style>
					<header>
						<h1><astro-dev-toolbar-icon icon="check-circle"></astro-dev-toolbar-icon>No accessibility issues detected.</h1>
					</header>
					<p>
						Nice work! This app scans the page and highlights common accessibility issues for you, like a missing "alt" attribute on an image.
					</p>
					`
				);

				canvas.append(window);
			}

			(['scroll', 'resize'] as const).forEach((event) => {
				window.addEventListener(event, refreshLintPositions);
			});
		}

		function refreshLintPositions() {
			const noAuditBlock = canvas.getElementById('no-audit');
			if (noAuditBlock) {
				const devOverlayRect = document
					.querySelector('astro-dev-toolbar')
					?.shadowRoot.querySelector('#dev-overlay')
					?.getBoundingClientRect();

				noAuditBlock.style.top = `${
					(devOverlayRect?.top ?? 0) - (devOverlayRect?.height ?? 0) - 16
				}px`;
			}

			audits.forEach(({ highlightElement, auditedElement }) => {
				const rect = auditedElement.getBoundingClientRect();
				positionHighlight(highlightElement, rect);
			});
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

			const rect = originalElement.getBoundingClientRect();
			const highlight = createHighlight(rect, 'warning');
			const tooltip = buildAuditTooltip(rule, originalElement);

			// Set the highlight/tooltip as being fixed position the highlighted element
			// is fixed. We do this so that we don't mistakenly take scroll position
			// into account when setting the tooltip/highlight positioning.
			//
			// We only do this once due to how expensive computed styles are to calculate,
			// and are unlikely to change. If that turns out to be wrong, reconsider this.
			const { isFixed } = getElementsPositionInDocument(originalElement);
			if (isFixed) {
				tooltip.style.position = highlight.style.position = 'fixed';
			}

			attachTooltipToHighlight(highlight, tooltip, originalElement);

			canvas.append(highlight);
			audits.push({ highlightElement: highlight, auditedElement: originalElement as HTMLElement });
		}

		function buildAuditTooltip(rule: AuditRule, element: Element) {
			const tooltip = document.createElement('astro-dev-toolbar-tooltip');
			const { title, message } = resolveAuditRule(rule, element);

			tooltip.sections = [
				{
					icon: 'warning',
					title: escapeHtml(title),
				},
				{
					content: escapeHtml(message),
				},
			];

			const elementFile = element.getAttribute('data-astro-source-file');
			const elementPosition = element.getAttribute('data-astro-source-loc');

			if (elementFile) {
				const elementFileWithPosition =
					elementFile + (elementPosition ? ':' + elementPosition : '');

				tooltip.sections.push({
					content: elementFileWithPosition.slice(
						(window as DevOverlayMetadata).__astro_dev_overlay__.root.length - 1 // We want to keep the final slash, so minus one.
					),
					clickDescription: 'Click to go to file',
					async clickAction() {
						// NOTE: The path here has to be absolute and without any errors (no double slashes etc)
						// or Vite will silently fail to open the file. Quite annoying.
						await fetch('/__open-in-editor?file=' + encodeURIComponent(elementFileWithPosition));
					},
				});
			}

			return tooltip;
		}

		function escapeHtml(unsafe: string) {
			return unsafe
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}
	},
} satisfies DevOverlayPlugin;
