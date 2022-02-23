if (import.meta.hot) {
	const parser = new DOMParser();
	import.meta.hot.on('astro:update', async ({ file }) => {
		const { default: diff } = await import('micromorph');
		console.log(`[vite] hot updated: ${file}`)
		import.meta.hot?.accept();
		const res = await fetch(`${window.location}`).then(res => res.text())
		const doc = parser.parseFromString(res, 'text/html');
		
		// Match incoming islands to current state
		const roots = Array.from(doc.querySelectorAll('astro-root'));
		const uids = new Set(Array.from(document.querySelectorAll('astro-root')).map(el => el.getAttribute('uid')));
		for (const root of roots) {
			const uid = root.getAttribute('uid')
			const current = document.querySelector(`astro-root[uid="${uid}"]`);
			if (current) {
				uids.delete(uid);
				root.innerHTML = current?.innerHTML;
			} else {
				console.log(Array.from(uids))
				console.log(`Could not find [${uid}]`)
			}
		}

		diff(document, doc)
	});
}
