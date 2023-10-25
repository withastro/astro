import type { DevOverlayMetadata, DevOverlayPlugin } from '../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../ui-library/highlight.js';
import type { DevOverlayTooltip } from '../ui-library/tooltip.js';
import { attachTooltipToHighlight, createHighlight, positionHighlight } from './utils/highlight.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M7.9 1.5v-.4a1.1 1.1 0 0 1 2.2 0v.4a1.1 1.1 0 1 1-2.2 0Zm-6.4 8.6a1.1 1.1 0 1 0 0-2.2h-.4a1.1 1.1 0 0 0 0 2.2h.4ZM12 3.7a1.1 1.1 0 0 0 1.4-.7l.4-1.1a1.1 1.1 0 0 0-2.1-.8l-.4 1.2a1.1 1.1 0 0 0 .7 1.4Zm-9.7 7.6-1.2.4a1.1 1.1 0 1 0 .8 2.1l1-.4a1.1 1.1 0 1 0-.6-2ZM20.8 17a1.9 1.9 0 0 1 0 2.6l-1.2 1.2a1.9 1.9 0 0 1-2.6 0l-4.3-4.2-1.6 3.6a1.9 1.9 0 0 1-1.7 1.2A1.9 1.9 0 0 1 7.5 20L2.7 5a1.9 1.9 0 0 1 2.4-2.4l15 5a1.9 1.9 0 0 1 .2 3.4l-3.7 1.6 4.2 4.3ZM19 18.3 14.6 14a1.9 1.9 0 0 1 .6-3l3.2-1.5L5.1 5.1l4.3 13.3 1.5-3.2a1.9 1.9 0 0 1 3-.6l4.4 4.4.7-.7Z"/></svg>';

export default {
	id: 'astro:xray',
	name: 'Xray',
	icon: icon,
	init(canvas) {
		let islandsOverlays: { highlightElement: DevOverlayHighlight; island: HTMLElement }[] = [];
		addIslandsOverlay();

		function addIslandsOverlay() {
			const islands = document.querySelectorAll<HTMLElement>('astro-island');

			islands.forEach((island) => {
				const computedStyle = window.getComputedStyle(island);
				const islandElement = (island.children[0] as HTMLElement) || island;

				// If the island is hidden, don't show an overlay on it
				if (islandElement.offsetParent === null || computedStyle.display === 'none') {
					return;
				}

				const rect = islandElement.getBoundingClientRect();
				const highlight = createHighlight(rect);
				const tooltip = buildIslandTooltip(island);
				attachTooltipToHighlight(highlight, tooltip, islandElement);

				canvas.append(highlight);
				islandsOverlays.push({ highlightElement: highlight, island: islandElement });
			});

			(['scroll', 'resize'] as const).forEach((event) => {
				window.addEventListener(event, () => {
					islandsOverlays.forEach(({ highlightElement, island: islandElement }) => {
						const newRect = islandElement.getBoundingClientRect();
						positionHighlight(highlightElement, newRect);
					});
				});
			});
		}

		function buildIslandTooltip(island: HTMLElement) {
			const tooltip = document.createElement('astro-overlay-tooltip') as DevOverlayTooltip;
			tooltip.sections = [];

			const islandProps = island.getAttribute('props')
				? JSON.parse(island.getAttribute('props')!)
				: {};
			const islandClientDirective = island.getAttribute('client');

			// Add the component client's directive if we have one
			if (islandClientDirective) {
				tooltip.sections.push({
					title: 'Client directive',
					inlineTitle: `<code>client:${islandClientDirective}</code>`,
				});
			}

			// Add the props if we have any
			if (Object.keys(islandProps).length > 0) {
				tooltip.sections.push({
					title: 'Props',
					content: `${Object.entries(islandProps)
						.map((prop) => `<code>${prop[0]}=${getPropValue(prop[1] as any)}</code>`)
						.join(', ')}`,
				});
			}

			// Add a click action to go to the file
			const islandComponentPath = island.getAttribute('component-url');
			if (islandComponentPath) {
				tooltip.sections.push({
					content: islandComponentPath,
					clickDescription: 'Click to go to file',
					async clickAction() {
						// NOTE: The path here has to be absolute and without any errors (no double slashes etc)
						// or Vite will silently fail to open the file. Quite annoying.
						await fetch(
							'/__open-in-editor?file=' +
								encodeURIComponent(
									(window as DevOverlayMetadata).__astro_dev_overlay__.root +
										islandComponentPath.slice(1)
								)
						);
					},
				});
			}

			return tooltip;
		}

		function getPropValue(prop: [number, any]) {
			const [_, value] = prop;
			return JSON.stringify(value, null, 2);
		}
	},
} satisfies DevOverlayPlugin;
