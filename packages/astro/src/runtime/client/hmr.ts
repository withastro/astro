/// <reference types="vite/client" />

if (import.meta.hot) {
	// Vite injects `<style type="text/css">` for ESM imports of styles
	// but Astro also SSRs with `<style>` blocks. This MutationObserver
	// removes any duplicates as soon as they are hydrated client-side.
	const injectedStyles = getInjectedStyles();
	const mo = new MutationObserver((records) => {
		for (const record of records) {
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
