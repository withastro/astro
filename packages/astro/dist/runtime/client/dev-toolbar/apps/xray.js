import { escape as escapeHTML } from 'html-escaper';
import {
	attachTooltipToHighlight,
	createHighlight,
	getElementsPositionInDocument,
	positionHighlight,
} from './utils/highlight.js';
import {
	closeOnOutsideClick,
	createWindowElement,
	synchronizePlacementOnUpdate,
} from './utils/window.js';
const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M7.9 1.5v-.4a1.1 1.1 0 0 1 2.2 0v.4a1.1 1.1 0 1 1-2.2 0Zm-6.4 8.6a1.1 1.1 0 1 0 0-2.2h-.4a1.1 1.1 0 0 0 0 2.2h.4ZM12 3.7a1.1 1.1 0 0 0 1.4-.7l.4-1.1a1.1 1.1 0 0 0-2.1-.8l-.4 1.2a1.1 1.1 0 0 0 .7 1.4Zm-9.7 7.6-1.2.4a1.1 1.1 0 1 0 .8 2.1l1-.4a1.1 1.1 0 1 0-.6-2ZM20.8 17a1.9 1.9 0 0 1 0 2.6l-1.2 1.2a1.9 1.9 0 0 1-2.6 0l-4.3-4.2-1.6 3.6a1.9 1.9 0 0 1-1.7 1.2A1.9 1.9 0 0 1 7.5 20L2.7 5a1.9 1.9 0 0 1 2.4-2.4l15 5a1.9 1.9 0 0 1 .2 3.4l-3.7 1.6 4.2 4.3ZM19 18.3 14.6 14a1.9 1.9 0 0 1 .6-3l3.2-1.5L5.1 5.1l4.3 13.3 1.5-3.2a1.9 1.9 0 0 1 3-.6l4.4 4.4.7-.7Z"/></svg>';
var xray_default = {
	id: 'astro:xray',
	name: 'Inspect',
	icon,
	init(canvas, eventTarget) {
		let islandsOverlays = [];
		addIslandsOverlay();
		document.addEventListener('astro:after-swap', addIslandsOverlay);
		document.addEventListener('astro:page-load', refreshIslandsOverlayPositions);
		closeOnOutsideClick(eventTarget);
		synchronizePlacementOnUpdate(eventTarget, canvas);
		function addIslandsOverlay() {
			islandsOverlays.forEach(({ highlightElement }) => {
				highlightElement.remove();
			});
			islandsOverlays = [];
			const islands = document.querySelectorAll('astro-island');
			if (islands.length === 0) {
				const window2 = createWindowElement(
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
							background: #5f9ea0;
							border-radius: 9999px;
						}
					</style>
					<header>
						<h1><astro-dev-toolbar-icon icon="lightbulb"></astro-dev-toolbar-icon>No islands detected.</h1>
					</header>
					<p>
						It looks like there are no interactive component islands on this page. Did you forget to add a client directive to your interactive UI component?
					</p>
					`,
				);
				canvas.append(window2);
				return;
			}
			islands.forEach((island) => {
				const computedStyle = window.getComputedStyle(island);
				const islandElement = island.children[0] || island;
				if (islandElement.offsetParent === null || computedStyle.display === 'none') {
					return;
				}
				const rect = islandElement.getBoundingClientRect();
				const highlight = createHighlight(rect);
				const tooltip = buildIslandTooltip(island);
				const { isFixed } = getElementsPositionInDocument(islandElement);
				if (isFixed) {
					tooltip.style.position = highlight.style.position = 'fixed';
				}
				attachTooltipToHighlight(highlight, tooltip, islandElement);
				canvas.append(highlight);
				islandsOverlays.push({ highlightElement: highlight, island: islandElement });
			});
			['scroll', 'resize'].forEach((event) => {
				window.addEventListener(event, refreshIslandsOverlayPositions);
			});
		}
		function refreshIslandsOverlayPositions() {
			islandsOverlays.forEach(({ highlightElement, island: islandElement }) => {
				const rect = islandElement.getBoundingClientRect();
				positionHighlight(highlightElement, rect);
			});
		}
		function buildIslandTooltip(island) {
			const tooltip = document.createElement('astro-dev-toolbar-tooltip');
			tooltip.sections = [];
			const islandProps = island.getAttribute('props')
				? JSON.parse(island.getAttribute('props'))
				: {};
			const islandClientDirective = island.getAttribute('client');
			if (islandClientDirective) {
				tooltip.sections.push({
					title: 'Client directive',
					inlineTitle: `<code>client:${islandClientDirective}</code>`,
				});
			}
			const islandPropsEntries = Object.entries(islandProps).filter(
				(prop) => !prop[0].startsWith('data-astro-cid-'),
			);
			if (islandPropsEntries.length > 0) {
				const stringifiedProps = JSON.stringify(
					Object.fromEntries(islandPropsEntries.map((prop) => [prop[0], prop[1][1]])),
					void 0,
					2,
				);
				tooltip.sections.push({
					title: 'Props',
					content: `<pre><code>${escapeHTML(stringifiedProps)}</code></pre>`,
				});
			}
			const islandComponentPath = island.getAttribute('component-url');
			if (islandComponentPath) {
				tooltip.sections.push({
					content: islandComponentPath,
					clickDescription: 'Click to go to file',
					async clickAction() {
						await fetch(
							'/__open-in-editor?file=' +
								encodeURIComponent(
									window.__astro_dev_toolbar__.root + islandComponentPath.slice(1),
								),
						);
					},
				});
			}
			return tooltip;
		}
	},
};
export { xray_default as default };
