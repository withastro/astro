if (import.meta.hot) {
	import.meta.hot.accept((mod) => mod);
	const parser = new DOMParser();
	async function updatePage() {
		const { default: diff } = await import('micromorph');
		const html = await fetch(`${window.location}`).then((res) => res.text());
		const doc = parser.parseFromString(html, 'text/html');

		// Match incoming islands to current state
		for (const root of doc.querySelectorAll('astro-root')) {
			const uid = root.getAttribute('uid');
			const current = document.querySelector(`astro-root[uid="${uid}"]`);
			if (current) {
				root.innerHTML = current?.innerHTML;
			}
		}
		return diff(document, doc);
	}
	async function updateAll(files: any[]) {
		let hasAstroUpdate = false;
		for (const file of files) {
			if (file.acceptedPath.endsWith('.astro')) {
				hasAstroUpdate = true;
				continue;
			}
			if (file.acceptedPath.includes('vue&type=style')) {
				const link = document.querySelector(`link[href="${file.acceptedPath}"]`);
				if (link) {
					link.replaceWith(link.cloneNode(true));
				}
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
