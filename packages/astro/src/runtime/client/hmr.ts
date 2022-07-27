/// <reference types="vite/client" />
if (import.meta.hot) {
	import.meta.hot.on('vite:beforeUpdate', async (payload) => {
		for (const file of payload.updates) {
			if (
				file.acceptedPath.includes('svelte&type=style') ||
				file.acceptedPath.includes('astro&type=style')
			) {
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
		}
	});
}
