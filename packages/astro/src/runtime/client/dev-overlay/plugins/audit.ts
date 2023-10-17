import type { DevOverlayItem } from '../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../ui-library/highlight.js';
import type { DevOverlayTooltip } from '../ui-library/tooltip.js';
import auditIcon from './audit.svg.js';

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
	icon: auditIcon,
	init(canvas, eventTarget) {
		let hasTriggeredRule = false;
		selectorBasedRules.forEach((rule) => {
			document.querySelectorAll(rule.selector).forEach((el) => {
				canvas.appendChild(createAuditProblem(rule, el));
			});
		});

		if (hasTriggeredRule) {
			eventTarget.dispatchEvent(
				new CustomEvent('plugin-notification', {
					detail: {
						state: true,
					},
				})
			);
		}

		function createAuditProblem(rule: AuditRule, originalElement: Element) {
			hasTriggeredRule = true;

			const highlight = document.createElement('astro-overlay-highlight') as DevOverlayHighlight;

			const rect = originalElement.getBoundingClientRect();

			highlight.icon = 'astro:warning';

			highlight.style.top = `${Math.max(rect.top + window.scrollY - 10, 0)}px`;
			highlight.style.left = `${Math.max(rect.left + window.scrollX - 10, 0)}px`;
			highlight.style.width = `${rect.width + 15}px`;
			highlight.style.height = `${rect.height + 15}px`;

			const tooltip = document.createElement('astro-overlay-tooltip') as DevOverlayTooltip;
			tooltip.sections = [
				{
					icon: 'astro:warning',
					title: rule.title,
				},
				{
					content: rule.message,
				},
				{
					content: '/src/somewhere/component.astro',
					clickDescription: 'Click to go to file',
					clickAction() {
						// TODO: Implement this
					},
				},
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
					tooltip.style.top = `${-tooltip.offsetHeight}px`;
				}
			});

			highlight.addEventListener('mouseout', () => {
				tooltip.dataset.show = 'false';
			});

			return highlight;
		}
	},
} satisfies DevOverlayItem;
