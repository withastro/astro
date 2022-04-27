
export default function clickToComponent() {
	window.addEventListener('click', (event) => {
		if (!event.altKey) return;
		const el = event.target;
		if (!isElement(el)) return;
		const url = getEditorURL(el);
		if (url) {
			window.open(url);
		}
	})
}

function isElement(node: EventTarget|null): node is HTMLElement {
	return !!(node as any)?.tagName;
}

let projectRoot: URL;
function getEditorURL(el: HTMLElement) {
	if (!projectRoot) {
		projectRoot = new URL(document.querySelector('html')?.dataset.astroSourceRoot ?? 'file://');
	}
	const file = el.dataset.astroSourceFile;
	const loc = el.dataset.astroSourceLoc;
	if (!file) return;
	const url = new URL(`.${file}${loc ? `:${loc}` : ''}`, projectRoot);
	return `vscode://file${url.pathname}`;
}
