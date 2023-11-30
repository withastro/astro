export function createWindowElement(content: string) {
	const windowElement = document.createElement('astro-dev-overlay-window');
	windowElement.innerHTML = content;
	return windowElement;
}
