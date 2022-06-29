/**
 * Hydrate this component when a matching media query is found
 */
(self.Astro = self.Astro || {}).media = (getHydrateCallback, options) => {
	const cb = async () => {
		let hydrate = await getHydrateCallback();
		await hydrate();
	};

	if (options.value) {
		const mql = matchMedia(options.value);
		if (mql.matches) {
			cb();
		} else {
			mql.addEventListener('change', cb, { once: true });
		}
	}
};
