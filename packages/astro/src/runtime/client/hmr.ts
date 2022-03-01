if (import.meta.hot) {
	// signal to Vite that we accept HMR
	import.meta.hot.accept((mod) => mod);
	const parser = new DOMParser();
	import.meta.hot.on('astro:update', async ({ file }) => {
		const { default: diff } = await import('micromorph');
		// eslint-disable-next-line no-console
		console.log(`[vite] hot updated: ${file}`);
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
		diff(document, doc);
	});
}
