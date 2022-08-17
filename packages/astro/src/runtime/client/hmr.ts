/// <reference types="vite/client" />
const attrs = {
	file: 'data-astro-source-file',
	loc: 'data-astro-source-loc',
}

if (import.meta.hot) {
	initClickToComponent();
	// Vite injects `<style type="text/css">` for ESM imports of styles
	// but Astro also SSRs with `<style>` blocks. This MutationObserver
	// removes any duplicates as soon as they are hydrated client-side.
	const injectedStyles = getInjectedStyles();
	const mo = new MutationObserver((records) => {
		for (const record of records) {
			cleanNodes(record.addedNodes);
			for (const node of record.addedNodes) {
				if (isViteInjectedStyle(node)) {
					injectedStyles.get(node.innerHTML.trim())?.remove();
				}
			}
		}
	});
	mo.observe(document.documentElement, { subtree: true, childList: true });

	// Vue `link` styles need to be manually refreshed in Firefox
	import.meta.hot.on('vite:beforeUpdate', async (payload) => {
		for (const file of payload.updates) {
			if (file.acceptedPath.includes('vue&type=style')) {
				const link = document.querySelector(`link[href="${file.acceptedPath}"]`);
				if (link) {
					link.replaceWith(link.cloneNode(true));
				}
			}
		}
	});
}

function getInjectedStyles() {
	const injectedStyles = new Map<string, Element>();
	document.querySelectorAll<HTMLStyleElement>('style').forEach((el) => {
		injectedStyles.set(el.innerHTML.trim(), el);
	});
	return injectedStyles;
}

function isStyle(node: Node): node is HTMLStyleElement {
	return node.nodeType === node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === 'style';
}

function isViteInjectedStyle(node: Node): node is HTMLStyleElement {
	return isStyle(node) && node.getAttribute('type') === 'text/css';
}

function isElement(node: EventTarget | null): node is HTMLElement {
	return !!(node as any)?.tagName;
}

function getEditorInfo(el: HTMLElement) {
	const { file, loc } = (el as any).__astro;
	if (!file) return;
	return { file, loc }
}

function initClickToComponent() {
	cleanNodes(document.querySelectorAll('[data-astro-source-file]'));
	const style = document.createElement('style')
	style.innerHTML = `[data-astro-edit] {
	outline: 0;	
}
astro-edit-overlay {
	transition: opacity 300ms linear ease-out;
	--padding-inline: 4px;
	--padding-block: 2px;
	position: fixed;
	top: 0;
	left: 0;
	pointer-events: none;
	transform-origin: top left;
	border: 1px solid #863BE4;
	width: calc(var(--width, 0) + (var(--padding-inline) * 2));
	height: calc(var(--height, 0) + (var(--padding-block) * 2));
	transform: translate(calc(var(--x, 0) - var(--padding-inline)), calc(var(--y, 0) - var(--padding-block)));
	border-radius: 2px;
}
`
	document.head.appendChild(style);
	const initialBody = document.body.innerHTML;
	let newBody = document.body.innerHTML;
	let altKey = false;
	let active = false;
	let target: HTMLElement | null = null;
	customElements.define('astro-edit-overlay', class AstroEditOverlay extends HTMLElement {})
	const overlay = document.createElement('astro-edit-overlay');
	document.body.appendChild(overlay);
	window.addEventListener('keydown', (event) => {
		if (!event.altKey) return;
		altKey = true;
		updateOverlay()
	})
	window.addEventListener('keyup', () => {
		altKey = false;
		updateOverlay();
	})
	window.addEventListener('mousemove', (event) => {
		if (!isElement(event.target)) return;
		if (event.target === document.documentElement || event.target === document.body) return;
		if (target !== event.target) {
			target = event.target
			updateOverlay();
		}
	})
	function updateOverlay() {
		if (!target) {
			return;
		}
		if (!altKey) {
			overlay.style.setProperty('opacity', '0');
			return;
		}
		overlay.style.removeProperty('opacity');
		const range = document.createRange();
		range.selectNodeContents(target!)
		let rect = range.getClientRects()[0]
		if (!rect) return;
		overlay.style.setProperty('--x', `${rect.left - window.scrollX}px`);
		overlay.style.setProperty('--y', `${rect.top - window.scrollY}px`);
		overlay.style.setProperty('--width', `${rect.width}px`);
		overlay.style.setProperty('--height', `${rect.height}px`);
	}
	window.addEventListener('click', (event) => {
		if (!event.altKey) return;
		const el = event.target;
		if (!isElement(el)) return;
		const detail = getEditorInfo(el);
		if (detail) {
			el.contentEditable = 'plaintext-only';
			el.setAttribute('data-astro-edit', '');
			const initialText = el.innerHTML;
			let newText = initialText;
			target = event.target as HTMLElement;
			el.focus();
			el.addEventListener('blur', () => {
				el.removeAttribute('contenteditable');
				el.removeAttribute('data-astro-edit');
				altKey = false;
				target = null;
				if (initialText.trim() === newText.trim()) return;
				newBody = document.body.innerHTML;
				import.meta.hot.send('astro:edit', { ...detail, replace: [initialText.trim(), newText.trim()] });
			})
			el.addEventListener('input', (event) => {
				newText = el.innerHTML;
				updateOverlay();
			})
		}
	});
}

function cleanNodes(nodes: NodeList) {
	for (const node of nodes) {
		if (isElement(node)) {
				(node as any).__astro = {};
				for (const [key, attr] of Object.entries(attrs)) {
					(node as any).__astro[key] = node.getAttribute(attr);
					node.removeAttribute(attr);
				}
		}
	}
}
