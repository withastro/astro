import type { DevOverlayItem } from '../../../../@types/astro.js';
import type { DevOverlayTooltip } from '../ui-toolkit.js';
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
	init(canvas) {
		createBase();

		selectorBasedRules.forEach((rule) => {
			document.querySelectorAll(rule.selector).forEach((el) => {
				canvas.appendChild(createAuditProblem(rule, el));
			});
		});

		function createAuditProblem(rule: AuditRule, originalElement: Element) {
			const el = document.createElement('div');
			el.className = 'astro-audit-problem';
			el.style.position = 'absolute';

			const rect = originalElement.getBoundingClientRect();
			el.style.top = `${Math.max(rect.top + window.scrollY - 10, 0)}px`;
			el.style.left = `${Math.max(rect.left + window.scrollX - 10, 0)}px`;
			el.style.width = `${rect.width + 15}px`;
			el.style.height = `${rect.height + 15}px`;

			el.innerHTML = `
			<div class="icon" style="left: ${rect.width}px;">
				<svg width="16px" height="16px">
					<use xlink:href="#astro:audit:warning" width="16px" height="16px"></use>
				</svg>
			</div>
			<astro-overlay-highlight></astro-overlay-highlight>
			`;

			const tooltip = document.createElement('astro-overlay-tooltip') as DevOverlayTooltip;
			tooltip.sections = [
				{
					icon: '<svg width="16px" height="16px"><use xlink:href="#astro:audit:warning" width="16px" height="16px"></use></svg>',
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

			el.appendChild(tooltip);
			el.addEventListener('mouseover', () => {
				tooltip.dialog.show();

				const dialogRect = tooltip.dialog.getBoundingClientRect();
				if (rect.top < dialogRect.height) {
					tooltip.style.top = `${rect.height + 15}px`;
				} else {
					tooltip.style.top = `${-dialogRect.height}px`;
				}
			});

			el.addEventListener('mouseout', () => {
				tooltip.dialog.close();
			});

			return el;
		}

		function createBase() {
			// Create style
			const style = document.createElement('style');
			// TODO: Should this be in the astro-overlay-highlight component?
			style.innerHTML = `
			.astro-audit-problem .icon {
				width: 24px;
				height: 24px;
				background: linear-gradient(0deg, #B33E66, #B33E66), linear-gradient(0deg, #351722, #351722);
				border: 1px solid rgba(53, 23, 34, 1);
				border-radius: 9999px;
				display: flex;
				justify-content: center;
				align-items: center;
				position: absolute;
				top: -15px;
			}
		`;

			const svgSymbols = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svgSymbols.setAttribute('aria-hidden', 'true');
			svgSymbols.setAttribute(
				'style',
				'position: absolute; width: 0; height: 0; overflow: hidden;'
			);
			svgSymbols.innerHTML = `
			<symbol viewBox="0 0 16 16" id="astro:audit:warning">
				<path fill="#fff" d="M8 .40625c-1.5019 0-2.97007.445366-4.21886 1.27978C2.53236 2.52044 1.55905 3.70642.984293 5.094.40954 6.48157.259159 8.00842.552165 9.48147.845172 10.9545 1.56841 12.3076 2.63041 13.3696c1.06201 1.062 2.41508 1.7852 3.88813 2.0782 1.47304.293 2.99989.1427 4.38746-.4321 1.3876-.5747 2.5736-1.5481 3.408-2.7968.8344-1.2488 1.2798-2.717 1.2798-4.2189-.0023-2.0133-.8031-3.9435-2.2267-5.36713C11.9435 1.20925 10.0133.408483 8 .40625ZM8 13.9062c-1.16814 0-2.31006-.3463-3.28133-.9953-.97128-.649-1.7283-1.5715-2.17533-2.6507-.44703-1.0792-.56399-2.26675-.3361-3.41245.22789-1.1457.79041-2.1981 1.61641-3.0241.82601-.826 1.8784-1.38852 3.0241-1.61641 1.1457-.2279 2.33325-.11093 3.41245.3361 1.0793.44703 2.0017 1.20405 2.6507 2.17532.649.97128.9954 2.11319.9954 3.28134-.0017 1.56592-.6245 3.0672-1.7318 4.1745S9.56592 13.9046 8 13.9062Zm-.84375-5.62495V4.625c0-.22378.0889-.43839.24713-.59662.15824-.15824.37285-.24713.59662-.24713.22378 0 .43839.08889.59662.24713.15824.15823.24713.37284.24713.59662v3.65625c0 .22378-.08889.43839-.24713.59662C8.43839 9.03611 8.22378 9.125 8 9.125c-.22377 0-.43838-.08889-.59662-.24713-.15823-.15823-.24713-.37284-.24713-.59662ZM9.125 11.0938c0 .2225-.06598.44-.18959.625-.12362.185-.29932.3292-.50489.4143-.20556.0852-.43176.1074-.64999.064-.21823-.0434-.41869-.1505-.57602-.3079-.15734-.1573-.26448-.3577-.30789-.576-.04341-.2182-.02113-.4444.06402-.65.08515-.2055.22934-.3812.41435-.5049.185-.1236.40251-.18955.62501-.18955.29837 0 .58452.11855.7955.32955.21098.2109.3295.4971.3295.7955Z"/>
			</symbol>
		`;

			canvas.appendChild(style);
			canvas.appendChild(svgSymbols);
		}
	},
} satisfies DevOverlayItem;
