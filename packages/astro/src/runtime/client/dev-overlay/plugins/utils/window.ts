export function createWindowElement(content: string) {
	const windowElement = document.createElement('astro-dev-toolbar-window');
	windowElement.innerHTML = content;
	return windowElement;
}
