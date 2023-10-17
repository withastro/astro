import type { DevOverlayItem } from '../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../ui-library/highlight.js';
import type { DevOverlayTooltip } from '../ui-library/tooltip.js';
import xrayIcon from './xray.svg.js';

export default {
	id: 'astro:xray',
	name: 'Xray',
	icon: xrayIcon,
	init(canvas, eventTarget) {
		let islandsOverlays: { highlightElement: DevOverlayHighlight; island: HTMLElement }[] = [];

		eventTarget.addEventListener('plugin-toggle', ((event: CustomEvent) => {
			if (event.detail.state === true) {
				addIslandsOverlay();
			}
		}) as EventListener);

		window.addEventListener('scroll', () => {
			islandsOverlays.forEach(({ highlightElement, island: islandElement }) => {
				const newRect = islandElement.getBoundingClientRect();
				highlightElement.style.top = `${Math.max(newRect.top + window.scrollY - 10, 0)}px`;
				highlightElement.style.left = `${Math.max(newRect.left + window.scrollX - 10, 0)}px`;
			});
		});

		function addIslandsOverlay() {
			canvas.innerHTML = '';
			const islands = document.querySelectorAll<HTMLElement>('astro-island');
			islandsOverlays = [];

			islands.forEach((island) => {
				const highlight = document.createElement('astro-overlay-highlight') as DevOverlayHighlight;

				const computedStyle = window.getComputedStyle(island);
				const islandElement = (island.children[0] as HTMLElement) || island;

				// If the island is hidden, don't show an overlay
				if (islandElement.offsetParent === null || computedStyle.display === 'none') {
					return;
				}

				const rect = islandElement.getBoundingClientRect();

				highlight.style.top = `${Math.max(rect.top + window.scrollY - 10, 0)}px`;
				highlight.style.left = `${Math.max(rect.left + window.scrollX - 10, 0)}px`;
				highlight.style.width = `${rect.width + 15}px`;
				highlight.style.height = `${rect.height + 15}px`;

				const islandProps = island.getAttribute('props')
					? JSON.parse(island.getAttribute('props')!)
					: {};
				const islandClientDirective = island.getAttribute('client');

				const tooltip = document.createElement('astro-overlay-tooltip') as DevOverlayTooltip;
				tooltip.sections = [];

				if (islandClientDirective) {
					tooltip.sections.push({
						title: 'Client directive',
						inlineTitle: `<code>client:${islandClientDirective}</code>`,
					});
				}

				if (Object.keys(islandProps).length > 0) {
					tooltip.sections.push({
						title: 'Props',
						content: `${Object.entries(islandProps)
							.map((prop) => `<code>${prop[0]}=${getPropValue(prop[1] as any)}</code>`)
							.join(', ')}`,
					});
				}

				tooltip.sections.push({
					content: '/src/somewhere/component.astro',
					clickDescription: 'Click to go to file',
					clickAction() {
						// TODO: Implement this
					},
				});

				highlight.shadowRoot.appendChild(tooltip);

				highlight.addEventListener('mouseover', () => {
					tooltip.dataset.show = 'true';
					const originalRect = islandElement.getBoundingClientRect();
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

				canvas.appendChild(highlight);
				islandsOverlays.push({ highlightElement: highlight, island: islandElement });
			});

			window.addEventListener('scroll', () => {
				islandsOverlays.forEach(({ highlightElement, island: islandElement }) => {
					const newRect = islandElement.getBoundingClientRect();
					highlightElement.style.top = `${Math.max(newRect.top + window.scrollY - 10, 0)}px`;
					highlightElement.style.left = `${Math.max(newRect.left + window.scrollX - 10, 0)}px`;
				});
			});
		}

		function getPropValue(prop: [number, any]) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [_, value] = prop;
			return JSON.stringify(value, null, 2);
		}
	},
} satisfies DevOverlayItem;
