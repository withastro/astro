const devPrerenderMiddlewareSymbol = /* @__PURE__ */ Symbol.for('astro.devPrerenderMiddleware');
function createNodePrerenderPlugin() {
	return {
		name: '@astrojs/cloudflare:dev-server-prerender-middleware',
		config() {
			return {
				environments: {
					prerender: { dev: {} },
				},
			};
		},
		configureServer(server) {
			server[devPrerenderMiddlewareSymbol] = true;
		},
	};
}
export { createNodePrerenderPlugin };
