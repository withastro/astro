import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../ui-library/highlight.js';
import { attachTooltipToHighlight, createHighlight, positionHighlight } from './utils/highlight.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 16"><path fill="#fff" d="M.6 2A1.1 1.1 0 0 1 1.7.9h16.6a1.1 1.1 0 1 1 0 2.2H1.6A1.1 1.1 0 0 1 .8 2Zm1.1 7.1h6a1.1 1.1 0 0 0 0-2.2h-6a1.1 1.1 0 0 0 0 2.2ZM9.3 13H1.8a1.1 1.1 0 1 0 0 2.2h7.5a1.1 1.1 0 1 0 0-2.2Zm11.3 1.9a1.1 1.1 0 0 1-1.5 0l-1.7-1.7a4.1 4.1 0 1 1 1.6-1.6l1.6 1.7a1.1 1.1 0 0 1 0 1.6Zm-5.3-3.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"/></svg>';

interface AuditRule {
	title: string;
	message: string;
}

const selectorBasedRules: (AuditRule & { selector: string })[] = [
	{
		title: 'Missing `alt` tag',
		message: 'The alt attribute is important for accessibility.',
		selector: 'img:not([alt])',
	},
];

export default {
	id: 'astro:audit',
	name: 'Audit',
	icon: icon,
	init(canvas, eventTarget) {
		let audits: { highlightElement: DevOverlayHighlight; auditedElement: HTMLElement }[] = [];

		lint();

		document.addEventListener('astro:after-swap', lint);
		document.addEventListener('astro:page-load', refreshLintPositions);

		function lint() {
			audits.forEach(({ highlightElement }) => {
				highlightElement.remove();
			});
			audits = [];

			selectorBasedRules.forEach((rule) => {
				document.querySelectorAll(rule.selector).forEach((el) => {
					createAuditProblem(rule, el);
				});
			});

			if (audits.length > 0) {
				eventTarget.dispatchEvent(
					new CustomEvent('plugin-notification', {
						detail: {
							state: true,
						},
					})
				);
			}
		}

		function refreshLintPositions() {
			audits.forEach(({ highlightElement, auditedElement }) => {
				const rect = auditedElement.getBoundingClientRect();
				positionHighlight(highlightElement, rect);
			});
		}

		function createAuditProblem(rule: AuditRule, originalElement: Element) {
			const computedStyle = window.getComputedStyle(originalElement);
			const targetedElement = (originalElement.children[0] as HTMLElement) || originalElement;

			// If the element is hidden, don't do anything
			if (targetedElement.offsetParent === null || computedStyle.display === 'none') {
				return;
			}

			const rect = originalElement.getBoundingClientRect();
			const highlight = createHighlight(rect, 'warning');
			const tooltip = buildAuditTooltip(rule);
			attachTooltipToHighlight(highlight, tooltip, originalElement);

			canvas.append(highlight);
			audits.push({ highlightElement: highlight, auditedElement: originalElement as HTMLElement });

			(['scroll', 'resize'] as const).forEach((event) => {
				window.addEventListener(event, refreshLintPositions);
			});
		}

		function buildAuditTooltip(rule: AuditRule) {
			const tooltip = document.createElement('astro-dev-overlay-tooltip');
			tooltip.sections = [
				{
					icon: 'warning',
					title: rule.title,
				},
				{
					content: rule.message,
				},
				// TODO: Add a link to the file
				// Needs https://github.com/withastro/compiler/pull/375
				// {
				// 	content: '/src/somewhere/component.astro',
				// 	clickDescription: 'Click to go to file',
				// 	clickAction() {},
				// },
			];

			return tooltip;
		}
	},
} satisfies DevOverlayPlugin;
