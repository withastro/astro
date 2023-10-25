import type { DevOverlayMetadata, DevOverlayPlugin } from '../../../../@types/astro.js';
import type { DevOverlayHighlight } from '../ui-library/highlight.js';
import type { DevOverlayTooltip } from '../ui-library/tooltip.js';

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

				const highlight = document.createElement('astro-overlay-highlight') as DevOverlayHighlight;
				const rect = islandElement.getBoundingClientRect();

				// Make an highlight that is 10px bigger than the element on all sides
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

			['scroll', 'resize'].forEach((event) => {
				window.addEventListener(event, () => {
					islandsOverlays.forEach(({ highlightElement, island: islandElement }) => {
						const newRect = islandElement.getBoundingClientRect();
						highlightElement.style.top = `${Math.max(newRect.top + window.scrollY - 10, 0)}px`;
						highlightElement.style.left = `${Math.max(newRect.left + window.scrollX - 10, 0)}px`;
						highlightElement.style.width = `${newRect.width + 15}px`;
						highlightElement.style.height = `${newRect.height + 15}px`;
					});
				});
			});
		}

		function getPropValue(prop: [number, any]) {
			const [_, value] = prop;
			return JSON.stringify(value, null, 2);
		}
	},
} satisfies DevOverlayPlugin;
