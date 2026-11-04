import { fileURLToPath } from 'node:url';
import type { AstroRenderer } from 'astro';
import { crawlFrameworkPkgs } from 'vitefu';
import { getContainerRenderer } from './container-renderer.js';

/**
 * Returns the Svelte renderer for `astro({ renderers: [svelte()] })` from
 * `@astrojs/vite-plugin-astro`: plain data, applied by `astro()`. Compiling `.svelte` files is the
 * job of `@sveltejs/vite-plugin-svelte`, added to the Vite `plugins` next to `astro()`.
 */
export default function svelte(): AstroRenderer {
	return {
		...getContainerRenderer(),
		optimizeDeps: {
			// `@sveltejs/vite-plugin-svelte` v7 force-includes Svelte's SSR runtime (`svelte/server`,
			// `svelte/internal/server`, ...) into `optimizeDeps` for server environments. Because
			// Astro's renderer entrypoint (`@astrojs/svelte/server.js`) is resolved as a `noExternal`
			// dependency, it keeps using the raw transformed copy of that runtime while the user's
			// compiled components use the pre-bundled copy — two instances of Svelte's server runtime
			// with separate `ssr_context` module state, which crashes dev SSR. Excluding `svelte` makes
			// vite-plugin-svelte skip the pre-bundle so every consumer shares one transformed copy.
			//
			// See related logic in vite-plugin-svelte:
			// https://github.com/sveltejs/vite-plugin-svelte/blob/@sveltejs/vite-plugin-svelte@7.1.2/packages/vite-plugin-svelte/src/plugins/setup-optimizer.js#L51-L52
			server: { exclude: ['svelte'] },
		},
		// Svelte component libraries from `node_modules` must go through Vite's transform pipeline
		// because Node can't import `.svelte` files. vite-plugin-svelte only marks a package as
		// `noExternal` when it has a `svelte` export condition; a package that merely declares a
		// `svelte` peer dependency is treated as a "semi-framework" package and routed through
		// `optimizeDeps` instead, so we crawl for those and `noExternal` them ourselves.
		//
		// See related logic in vite-plugin-svelte:
		// https://github.com/sveltejs/vite-plugin-svelte/blob/@sveltejs/vite-plugin-svelte@7.1.2/packages/vite-plugin-svelte/src/utils/options.js#L478-L513
		async noExternal({ root }) {
			const sveltePackages = await crawlFrameworkPkgs({
				root: fileURLToPath(root),
				isBuild: false,
				isFrameworkPkgByJson(pkgJson) {
					return !!pkgJson.peerDependencies?.svelte;
				},
			});
			return sveltePackages.ssr.noExternal;
		},
	};
}
