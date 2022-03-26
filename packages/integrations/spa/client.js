import listen from 'micromorph/spa';

export default ({ persistent }) => {
	listen({
		beforeDiff(doc) {
			if (!persistent) return;
			for (const island of doc.querySelectorAll('astro-root')) {
				const uid = island.getAttribute('uid');
				const current = document.querySelector(`astro-root[uid="${uid}"]`);
				if (current) {
					current.dataset.persist = true;
					island.replaceWith(current);
				}
			}
		},
		afterDiff() {
			if (persistent) {
				for (const island of doc.querySelectorAll('astro-root')) {
					delete island.dataset.persist
				}
			}
			window.dispatchEvent(new CustomEvent('astro:locationchange'));
		},
	});
};
