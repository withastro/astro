(self.Astro = self.Astro || {}).load = (getHydrateCallback) => {
	(async () => {
		let hydrate = await getHydrateCallback();
		await hydrate();
	})();
};
