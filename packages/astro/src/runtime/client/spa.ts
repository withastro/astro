import listen from 'micromorph/spa'

listen({
	beforeDiff(doc) {
		for (const island of doc.querySelectorAll('astro-root[data-persist]')) {
			const uid = island.getAttribute('uid');
			const current = document.querySelector(`astro-root[data-persist][uid="${uid}"]`)
			if (current) {
				island.replaceWith(current);
			}
		}
	},
	afterDiff() {
		window.dispatchEvent(new CustomEvent('astro:locationchange'))
	}
});

