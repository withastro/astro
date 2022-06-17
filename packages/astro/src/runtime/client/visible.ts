/**
 * Hydrate this component when one of it's children becomes visible
 * We target the children because `astro-island` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
(self.Astro = self.Astro || {}).visible = (getHydrateCallback, _opts, root) => {
	const cb = async () => {
		let hydrate = await getHydrateCallback();
		await hydrate();
	};

	let io = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			// As soon as we hydrate, disconnect this IntersectionObserver for every `astro-island`
			io.disconnect();
			cb();
			break; // break loop on first match
		}
	});

	for (let i = 0; i < root.children.length; i++) {
		const child = root.children[i];
		io.observe(child);
	}
};
