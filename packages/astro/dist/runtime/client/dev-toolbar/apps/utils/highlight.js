function createHighlight(rect, icon, additionalAttributes) {
	const highlight = document.createElement('astro-dev-toolbar-highlight');
	if (icon) highlight.icon = icon;
	if (additionalAttributes) {
		for (const [key, value] of Object.entries(additionalAttributes)) {
			highlight.setAttribute(key, value);
		}
	}
	highlight.tabIndex = 0;
	if (rect.width === 0 || rect.height === 0) {
		highlight.style.display = 'none';
	} else {
		positionHighlight(highlight, rect);
	}
	return highlight;
}
function getElementsPositionInDocument(el) {
	let isFixed = false;
	let current = el;
	while (current instanceof Element) {
		let style = getComputedStyle(current);
		if (style.position === 'fixed') {
			isFixed = true;
		}
		current = current.parentNode;
	}
	return {
		isFixed,
	};
}
function positionHighlight(highlight, rect) {
	highlight.style.display = 'block';
	const scrollY = highlight.style.position === 'fixed' ? 0 : window.scrollY;
	highlight.style.top = `${Math.max(rect.top + scrollY - 10, 0)}px`;
	highlight.style.left = `${Math.max(rect.left + window.scrollX - 10, 0)}px`;
	highlight.style.width = `${rect.width + 15}px`;
	highlight.style.height = `${rect.height + 15}px`;
}
function attachTooltipToHighlight(highlight, tooltip, originalElement) {
	highlight.shadowRoot.append(tooltip);
	['mouseover', 'focus'].forEach((event) => {
		highlight.addEventListener(event, () => {
			tooltip.dataset.show = 'true';
			const originalRect = originalElement.getBoundingClientRect();
			const dialogRect = tooltip.getBoundingClientRect();
			if (originalRect.top < dialogRect.height) {
				tooltip.style.top = `${originalRect.height + 15}px`;
			} else {
				tooltip.style.top = `-${tooltip.offsetHeight}px`;
			}
			if (dialogRect.right > document.documentElement.clientWidth) {
				tooltip.style.right = '0px';
			} else if (dialogRect.left < 0) {
				tooltip.style.left = '0px';
			}
		});
	});
	['mouseout', 'blur'].forEach((event) => {
		highlight.addEventListener(event, () => {
			tooltip.dataset.show = 'false';
		});
	});
}
export {
	attachTooltipToHighlight,
	createHighlight,
	getElementsPositionInDocument,
	positionHighlight,
};
