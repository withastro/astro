import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../ui-library/highlight.js';
import type { DevOverlayTooltip } from '../ui-library/tooltip.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" fill="none"><path fill="#fff" d="M.625 2c0-.29837.118526-.58452.329505-.7955C1.16548.993526 1.45163.875 1.75.875h16.5c.2984 0 .5845.118526.7955.3295.211.21098.3295.49713.3295.7955 0 .29837-.1185.58452-.3295.7955-.211.21097-.4971.3295-.7955.3295H1.75c-.29837 0-.58452-.11853-.795495-.3295C.743526 2.58452.625 2.29837.625 2ZM1.75 9.125h6c.29837 0 .58452-.11853.7955-.32951.21097-.21097.3295-.49712.3295-.79549s-.11853-.58452-.3295-.7955c-.21098-.21097-.49713-.3295-.7955-.3295h-6c-.29837 0-.58452.11853-.795495.3295C.743526 7.41548.625 7.70163.625 8c0 .29837.118526.58452.329505.79549.210975.21098.497125.32951.795495.32951Zm7.5 3.75h-7.5c-.29837 0-.58452.1185-.795495.3295C.743526 13.4155.625 13.7016.625 14s.118526.5845.329505.7955c.210975.211.497125.3295.795495.3295h7.5c.29837 0 .58452-.1185.7955-.3295.211-.211.3295-.4971.3295-.7955s-.1185-.5845-.3295-.7955c-.21098-.211-.49713-.3295-.7955-.3295Zm11.2959 1.9209c-.1045.1049-.2287.1881-.3654.2449-.1368.0568-.2834.086-.4314.086-.1481 0-.2947-.0292-.4315-.086-.1367-.0568-.2609-.14-.3654-.2449l-1.695-1.695c-.8694.4849-1.8849.6389-2.859.4338s-1.8411-.7556-2.4412-1.5498c-.6001-.7943-.8927-1.7787-.8239-2.77183.0688-.99308.4944-1.92778 1.1983-2.63167.7039-.7039 1.6386-1.12951 2.6317-1.19832.9931-.06881 1.9775.22382 2.7718.82391.7942.60009 1.3447 1.46716 1.5498 2.44126.2051.9741.0511 1.98955-.4338 2.85895l1.695 1.6941c.1051.1045.1884.2287.2453.3656.0568.1368.0861.2835.0861.4317s-.0293.2949-.0861.4317c-.0569.1369-.1402.2611-.2453.3656ZM15.25 11.375c.3708 0 .7334-.11 1.0417-.316.3083-.206.5487-.4989.6906-.8415.1419-.34258.179-.71958.1067-1.0833-.0724-.36371-.251-.6978-.5132-.96003-.2622-.26222-.5963-.4408-.96-.51314-.3637-.07235-.7407-.03522-1.0833.1067-.3426.14191-.6355.38223-.8415.69058-.206.30834-.316.67085-.316 1.04169 0 .24623.0485.49005.1427.7175.0943.2275.2324.4342.4065.6083.1741.1741.3808.3122.6083.4065.2275.0942.4713.1427.7175.1427Z"/></svg>';

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
