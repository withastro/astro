(self.Astro = self.Astro || {}).idle = (getHydrateCallback) => {
	const cb = async () => {
		let hydrate = await getHydrateCallback();
		await hydrate();
	};

	if ('requestIdleCallback' in window) {
		(window as any).requestIdleCallback(cb);
	} else {
		setTimeout(cb, 200);
	}
};
