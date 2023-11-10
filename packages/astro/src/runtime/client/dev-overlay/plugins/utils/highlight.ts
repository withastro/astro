import type { DevOverlayHighlight } from '../../ui-library/highlight.js';
import type { Icon } from '../../ui-library/icons.js';

export function createHighlight(rect: DOMRect, icon?: Icon) {
	const highlight = document.createElement('astro-dev-overlay-highlight');
	if (icon) highlight.icon = icon;

	highlight.tabIndex = 0;

	if (rect.width === 0 || rect.height === 0) {
		highlight.style.display = 'none';
	} else {
		positionHighlight(highlight, rect);
	}
	return highlight;
}

export function positionHighlight(highlight: DevOverlayHighlight, rect: DOMRect) {
	highlight.style.display = 'block';
	// Make an highlight that is 10px bigger than the element on all sides
	highlight.style.top = `${Math.max(rect.top + window.scrollY - 10, 0)}px`;
	highlight.style.left = `${Math.max(rect.left + window.scrollX - 10, 0)}px`;
	highlight.style.width = `${rect.width + 15}px`;
	highlight.style.height = `${rect.height + 15}px`;
}

export function attachTooltipToHighlight(
	highlight: DevOverlayHighlight,
	tooltip: HTMLElement,
	originalElement: Element
) {
	highlight.shadowRoot.append(tooltip);

	(['mouseover', 'focus'] as const).forEach((event) => {
		highlight.addEventListener(event, () => {
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
	});

	(['mouseout', 'blur'] as const).forEach((event) => {
		highlight.addEventListener(event, () => {
			tooltip.dataset.show = 'false';
		});
	});
}
