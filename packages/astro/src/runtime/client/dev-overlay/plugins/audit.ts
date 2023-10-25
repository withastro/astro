import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../ui-library/highlight.js';
import type { DevOverlayTooltip } from '../ui-library/tooltip.js';

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

		function createAuditProblem(rule: AuditRule, originalElement: Element) {
			const computedStyle = window.getComputedStyle(originalElement);
			const targetedElement = (originalElement.children[0] as HTMLElement) || originalElement;

			// If the element is hidden, don't do anything
			if (targetedElement.offsetParent === null || computedStyle.display === 'none') {
				return;
			}

			const highlight = document.createElement('astro-overlay-highlight') as DevOverlayHighlight;
			highlight.icon = 'warning';

			const rect = originalElement.getBoundingClientRect();

			// Make an highlight that is 10px bigger than the element on all sides
			highlight.style.top = `${Math.max(rect.top + window.scrollY - 10, 0)}px`;
			highlight.style.left = `${Math.max(rect.left + window.scrollX - 10, 0)}px`;
			highlight.style.width = `${rect.width + 15}px`;
			highlight.style.height = `${rect.height + 15}px`;

			const tooltip = document.createElement('astro-overlay-tooltip') as DevOverlayTooltip;
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

			highlight.shadowRoot.appendChild(tooltip);

			highlight.addEventListener('mouseover', () => {
				tooltip.dataset.show = 'true';
				const originalRect = originalElement.getBoundingClientRect();
				const dialogRect = tooltip.getBoundingClientRect();

				// If the tooltip is going to be off the screen, show it above the element instead
				if (originalRect.top < dialogRect.height) {
					// Not enough space above, show below
					tooltip.style.top = `${originalRect.height + 15}px`;
				} else {
					tooltip.style.top = `-${tooltip.offsetHeight}px`;
				}
			});

			// Hide the tooltip when the highlight is not hovered anymore
			highlight.addEventListener('mouseout', () => {
				tooltip.dataset.show = 'false';
			});

			canvas.appendChild(highlight);
			audits.push({ highlightElement: highlight, auditedElement: originalElement as HTMLElement });

			['scroll', 'resize'].forEach((event) => {
				window.addEventListener(event, () => {
					audits.forEach(({ highlightElement, auditedElement }) => {
						const newRect = auditedElement.getBoundingClientRect();
						highlightElement.style.top = `${Math.max(newRect.top + window.scrollY - 10, 0)}px`;
						highlightElement.style.left = `${Math.max(newRect.left + window.scrollX - 10, 0)}px`;
						highlightElement.style.width = `${newRect.width + 15}px`;
						highlightElement.style.height = `${newRect.height + 15}px`;
					});
				});
			});
		}
	},
} satisfies DevOverlayPlugin;
