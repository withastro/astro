import type { DevOverlayItem } from '../../../../@types/astro.js';
import type { DevOverlayTooltip } from '../ui-toolkit.js';
import xrayIcon from './xray.svg.js';

export default {
	id: 'astro:xray',
	name: 'Xray',
	icon: xrayIcon,
	init(canvas, eventTarget) {
		let islandsOverlays: { el: HTMLDivElement; island: HTMLElement }[] = [];

		eventTarget.addEventListener('plugin-toggle', ((event: CustomEvent) => {
			if (event.detail.state === true) {
				addIslandsOverlay();
			}
		}) as EventListener);

		window.addEventListener('scroll', () => {
			islandsOverlays.forEach(({ el, island: islandElement }) => {
				const newRect = islandElement.getBoundingClientRect();
				el.style.top = `${Math.max(newRect.top + window.scrollY - 10, 0)}px`;
				el.style.left = `${Math.max(newRect.left + window.scrollX - 10, 0)}px`;
			});
		});

		function addIslandsOverlay() {
			canvas.innerHTML = '';
			const islands = document.querySelectorAll<HTMLElement>('astro-island');
			islandsOverlays = [];

			islands.forEach((island) => {
				const el = document.createElement('div');
				el.style.position = 'absolute';

				const computedStyle = window.getComputedStyle(island);
				const islandElement = (island.children[0] as HTMLElement) || island;

				// If the island is hidden, don't show an overlay
				if (islandElement.offsetParent === null || computedStyle.display === 'none') {
					return;
				}

				const rect = islandElement.getBoundingClientRect();
				el.style.top = `${Math.max(rect.top + window.scrollY - 10, 0)}px`;
				el.style.left = `${Math.max(rect.left + window.scrollX - 10, 0)}px`;

				el.style.width = `${rect.width + 15}px`;
				el.style.height = `${rect.height + 15}px`;

				el.innerHTML = `
				<astro-overlay-highlight></astro-overlay-highlight>
			`;

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

				canvas.appendChild(el);
				islandsOverlays.push({ el: el, island: islandElement });
			});

			window.addEventListener('scroll', () => {
				islandsOverlays.forEach(({ el, island: islandElement }) => {
					const newRect = islandElement.getBoundingClientRect();
					el.style.top = `${Math.max(newRect.top + window.scrollY - 10, 0)}px`;
					el.style.left = `${Math.max(newRect.left + window.scrollX - 10, 0)}px`;
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
