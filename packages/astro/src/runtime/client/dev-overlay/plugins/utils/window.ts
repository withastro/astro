import type { Icon } from '../../ui-library/icons.js';

export function createWindowWithTransition(
	title: string,
	icon: Icon,
	content: string
): DocumentFragment {
	const fragment = document.createDocumentFragment();

	const style = document.createElement('style');
	style.textContent = `
			:host {
				opacity: 0;
				transition: opacity 0.15s ease-in-out;
			}

			:host([data-active]) {
				opacity: 1;
			}

			@media screen and (prefers-reduced-motion: no-preference) {
				:host astro-dev-overlay-window {
					transform: translateY(55px) translate(-50%, -50%);
					transition: transform 0.15s ease-in-out;
					transform-origin: center bottom;
				}

				:host([data-active]) astro-dev-overlay-window {
					transform: translateY(0) translate(-50%, -50%);
				}
			}
		`;
	fragment.append(style);

	const window = document.createElement('astro-dev-overlay-window');
	window.windowTitle = title;
	window.windowIcon = icon;
	window.innerHTML = content;

	fragment.append(window);

	return fragment;
}
