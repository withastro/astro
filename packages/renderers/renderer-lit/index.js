// NOTE: @lit-labs/ssr uses syntax incompatible with anything < Node v13.9.0.
// Throw an error if using that Node version.

const NODE_VERSION = parseFloat(process.versions.node);
if (NODE_VERSION < 13.9) {
	throw new Error(
		`Package @lit-labs/ssr requires Node version v13.9 or higher. Please update Node to use @astrojs/renderer-lit`
	);
}

export default {
	name: '@astrojs/renderer-lit',
	server: './server.js',
	polyfills: ['./client-shim.js'],
	hydrationPolyfills: ['./hydration-support.js'],
	viteConfig() {
		return {
			optimizeDeps: {
				include: [
					'@astrojs/renderer-lit/client-shim.js',
					'@astrojs/renderer-lit/hydration-support.js',
					'@webcomponents/template-shadowroot/template-shadowroot.js',
					'lit/experimental-hydrate-support.js',
				],
				exclude: ['@astrojs/renderer-lit/server.js'],
			},
			ssr: {
				external: [
					'lit-element/lit-element.js',
					'@lit-labs/ssr/lib/install-global-dom-shim.js',
					'@lit-labs/ssr/lib/render-lit-html.js',
					'@lit-labs/ssr/lib/lit-element-renderer.js',
				],
			},
		};
	},
};
