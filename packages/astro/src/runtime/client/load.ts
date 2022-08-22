(self.Astro = self.Astro || {}).load = (getHydrateCallback) => {
	(async () => {
		let hydrate = await getHydrateCallback();
		await hydrate();
	})();
};
window.dispatchEvent(new Event('astro:load'));
