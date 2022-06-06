if (import.meta.hot) {
	import.meta.hot.accept((mod) => mod);
	const parser = new DOMParser();
	async function updatePage() {
		const { default: diff } = await import('micromorph');
		const html = await fetch(`${window.location}`).then((res) => res.text());
		const doc = parser.parseFromString(html, 'text/html');
		for (const style of sheetsMap.values()) {
			doc.head.appendChild(style);
		}
		// Match incoming islands to current state
		for (const root of doc.querySelectorAll('astro-root')) {
			const uid = root.getAttribute('uid');
			const current = document.querySelector(`astro-root[uid="${uid}"]`);
			if (current) {
				current.setAttribute('data-persist', '');
				root.replaceWith(current);
			}
		}
		// both Vite and Astro's HMR scripts include `type="text/css"` on injected
		// <style> blocks. These style blocks would not have been rendered in Astro's
		// build and need to be persisted when diffing HTML changes.
		for (const style of document.querySelectorAll("style[type='text/css']")) {
			style.setAttribute('data-persist', '');
			doc.head.appendChild(style.cloneNode(true));
		}
		return diff(document, doc).then(() => {
			// clean up data-persist attributes added before diffing
			for (const root of document.querySelectorAll('astro-root[data-persist]')) {
				root.removeAttribute('data-persist');
			}
			for (const style of document.querySelectorAll("style[type='text/css'][data-persist]")) {
				style.removeAttribute('data-persist');
			}
		});
	}
	async function updateAll(files: any[]) {
		let hasAstroUpdate = false;
		let styles = [];
		for (const file of files) {
			if (file.acceptedPath.endsWith('.astro')) {
				hasAstroUpdate = true;
				continue;
			}
			if (file.acceptedPath.includes('svelte&type=style')) {
				// This will only be called after the svelte component has hydrated in the browser.
				// At this point Vite is tracking component style updates, we need to remove
				// styles injected by Astro for the component in favor of Vite's internal HMR.
				const injectedStyle = document.querySelector(
					`style[data-astro-injected="${file.acceptedPath}"]`
				);
				if (injectedStyle) {
					injectedStyle.parentElement?.removeChild(injectedStyle);
				}
			}
			if (file.acceptedPath.includes('vue&type=style')) {
				const link = document.querySelector(`link[href="${file.acceptedPath}"]`);
				if (link) {
					link.replaceWith(link.cloneNode(true));
				}
			}
			if (file.acceptedPath.includes('astro&type=style')) {
				styles.push(
					fetch(file.acceptedPath)
						.then((res) => res.text())
						.then((res) => [file.acceptedPath, res])
				);
			}
		}
		if (styles.length > 0) {
			for (const [id, content] of await Promise.all(styles)) {
				updateStyle(id, content);
			}
		}
		if (hasAstroUpdate) {
			return await updatePage();
		}
	}
	import.meta.hot.on('vite:beforeUpdate', async (event) => {
		await updateAll(event.updates);
	});
}

const sheetsMap = new Map();

function updateStyle(id: string, content: string): void {
	let style = sheetsMap.get(id);
	if (style && !(style instanceof HTMLStyleElement)) {
		removeStyle(id);
		style = undefined;
	}

	if (!style) {
		style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.innerHTML = content;
		document.head.appendChild(style);
	} else {
		style.innerHTML = content;
	}
	sheetsMap.set(id, style);
}

function removeStyle(id: string): void {
	const style = sheetsMap.get(id);
	if (style) {
		if (style instanceof CSSStyleSheet) {
			// @ts-expect-error: using experimental API
			document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
				(s: CSSStyleSheet) => s !== style
			);
		} else {
			document.head.removeChild(style);
		}
		sheetsMap.delete(id);
	}
}
