const RedirectComponentInstance = {
	default() {
		return new Response(null, {
			status: 301,
		});
	},
};
const RedirectSinglePageBuiltModule = {
	page: () => Promise.resolve(RedirectComponentInstance),
	onRequest: (_, next) => next(),
};
export { RedirectComponentInstance, RedirectSinglePageBuiltModule };
