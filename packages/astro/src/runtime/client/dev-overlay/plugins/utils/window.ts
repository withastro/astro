export function createWindowWithTransition(windowContent: string, addedNodes: Node[] = []) {
	const windowElement = document.createElement('astro-dev-overlay-window');
	windowElement.innerHTML = `
				<style>
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
				</style>
				${windowContent}
		`;

	windowElement.append(...addedNodes);

	return windowElement;
}

export async function waitForTransition(canvas: ShadowRoot): Promise<boolean> {
	canvas.host?.removeAttribute('data-active');

	await new Promise((resolve) => {
		canvas.host.addEventListener('transitionend', resolve);
	});

	return true;
}
