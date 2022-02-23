if (import.meta.hot) {
	const parser = new DOMParser();
	import.meta.hot.on('astro:update', async ({ file }) => {
		const { default: diff } = await import('micromorph');
		// eslint-disable-next-line no-console
		console.log(`[vite] hot updated: ${file}`)
		import.meta.hot?.accept();
		const html = await fetch(`${window.location}`).then(res => res.text())
		const doc = parser.parseFromString(html, 'text/html');
		
		// Match incoming islands to current state
		const roots = Array.from(doc.querySelectorAll('astro-root'));
		for (const root of roots) {
			const uid = root.getAttribute('uid')
			const current = document.querySelector(`astro-root[uid="${uid}"]`);
			if (current) {
				root.innerHTML = current?.innerHTML;
			}
		}

		diff(document, doc)
	});
}
