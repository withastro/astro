import { fileURLToPath } from 'node:url';
import type { AstroRenderer } from 'astro';
import { crawlFrameworkPkgs } from 'vitefu';
import { getContainerRenderer } from './container-renderer.js';

/**
 * Returns the Solid renderer for `astro({ renderers: [solid()] })` from
 * `@astrojs/vite-plugin-astro`: plain data, applied by `astro()`. Compiling JSX is the job of
 * `vite-plugin-solid` with `ssr: true`, added to the Vite `plugins` next to `astro()`.
 */
export default function solid(): AstroRenderer {
	return {
		...getContainerRenderer(),
		optimizeDeps: {
			client: {
				include: ['@astrojs/solid-js/client.js'],
				exclude: ['@astrojs/solid-js/server.js'],
			},
			server: { exclude: ['@astrojs/solid-js/server.js'] },
		},
		// Solid component libraries that ship pre-compiled browser artifacts via the `exports.solid`
		// condition must go through Vite's transform pipeline in server environments. Without this,
		// Node resolves those packages via the `default` condition, which picks up browser-only code
		// that crashes during prerendering.
		async noExternal({ root }) {
			const solidPackages = await crawlFrameworkPkgs({
				root: fileURLToPath(root),
				isBuild: false,
				isFrameworkPkgByJson(pkgJson) {
					return !!pkgJson.peerDependencies?.['solid-js'];
				},
			});
			return solidPackages.ssr.noExternal;
		},
	};
}
