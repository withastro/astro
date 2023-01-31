/**
 * Hydrate this component only on the client
 */
(self.Astro = self.Astro || {}).only = (getHydrateCallback) => {
	(async () => {
		let hydrate = await getHydrateCallback();
		await hydrate();
	})();
};
window.dispatchEvent(new Event('astro:only'));
