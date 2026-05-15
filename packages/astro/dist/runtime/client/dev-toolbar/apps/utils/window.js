import { settings } from '../../settings.js';
function createWindowElement(content, placement = settings.config.placement) {
	const windowElement = document.createElement('astro-dev-toolbar-window');
	windowElement.innerHTML = content;
	windowElement.placement = placement;
	return windowElement;
}
function closeOnOutsideClick(eventTarget, additionalCheck) {
	function onPageClick(event) {
		const target = event.target;
		if (!target) return;
		if (!target.closest) return;
		if (target.closest('astro-dev-toolbar')) return;
		if (additionalCheck && additionalCheck(target)) return;
		eventTarget.dispatchEvent(
			new CustomEvent('toggle-app', {
				detail: {
					state: false,
				},
			}),
		);
	}
	eventTarget.addEventListener('app-toggled', (event) => {
		if (event.detail.state === true) {
			document.addEventListener('click', onPageClick, true);
		} else {
			document.removeEventListener('click', onPageClick, true);
		}
	});
}
function synchronizePlacementOnUpdate(eventTarget, canvas) {
	eventTarget.addEventListener('placement-updated', (evt) => {
		if (!(evt instanceof CustomEvent)) {
			return;
		}
		const windowElement = canvas.querySelector('astro-dev-toolbar-window');
		if (!windowElement) {
			return;
		}
		const event = evt;
		windowElement.placement = event.detail.placement;
	});
}
export { closeOnOutsideClick, createWindowElement, synchronizePlacementOnUpdate };
