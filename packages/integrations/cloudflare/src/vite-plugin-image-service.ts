import type { Plugin } from 'vite';

/**
 * The core `astro:assets` plugin resolves `virtual:image-service` to the
 * configured `image.service.entrypoint`. With Cloudflare we need different
 * behaviour per environment:
 *
 * - **Prerender** (workerd): use the workerd stub for URL generation only
 * - **SSR** (runtime Worker): use the runtime service (passthrough / binding)
 *
 * The interceptor plugin runs with `enforce: 'pre'` so it claims the virtual
 * module before Astro core can resolve it to the user's custom service (e.g.
 * custom services). This keeps Node-only code out of all Worker bundles.
 */
const ASTRO_VIRTUAL_SERVICE_ID = 'virtual:image-service';
const RESOLVED_ID = '\0cloudflare:image-service';

export interface ImageServicePluginOptions {
	/** Workerd-compatible stub used during prerendering (URL generation only). */
	prerenderEntrypoint: string;
	/** Service used at runtime in the deployed Worker. */
	runtimeEntrypoint: string;
	/** Lazy getter — returns the custom service entrypoint captured in config:done, if any. */
	getBuildServiceEntrypoint: () => string | undefined;
	/** Callback invoked with the relative output path of the emitted image service file. */
	onService: (relativePath: string) => void;
}

/**
 * Returns two Vite plugins that handle the workerd/Node service split:
 *
 * 1. **Interceptor** (`enforce: 'pre'`): hijacks `virtual:image-service` before
 *    Astro core and emits branching code — `isPrerender ? stub : runtimeService`.
 *    This keeps the real (Node-only) service out of all Worker bundles.
 *
 * 2. **Emitter** (SSR build only): compiles the custom image service as a
 *    standalone Rollup chunk. This is the "smuggling" step — the chunk ends up
 *    in the server output directory where `prerenderer.ts` can `import()` it in
 *    Node after prerendering finishes. Without this, the custom service would
 *    only exist inside the workerd bundle where it can't run.
 */
export function createImageServicePlugins(
	options: ImageServicePluginOptions,
): Plugin[] {
	let emitRef: string | undefined;

	const interceptor: Plugin = {
		name: '@astrojs/cloudflare:image-service-interceptor',
		enforce: 'pre',
		resolveId: {
			filter: { id: new RegExp(`^${ASTRO_VIRTUAL_SERVICE_ID}$`) },
			handler(id) {
				if (id === ASTRO_VIRTUAL_SERVICE_ID) {
					return RESOLVED_ID;
				}
			},
		},
		load: {
			filter: { id: new RegExp(`^${RESOLVED_ID.replace('\0', '\\0')}$`) },
			handler(id) {
				if (id !== RESOLVED_ID) return;
				return [
					`import { isPrerender } from 'virtual:astro-cloudflare:config';`,
					`import prerenderService from ${JSON.stringify(options.prerenderEntrypoint)};`,
					`import runtimeService from ${JSON.stringify(options.runtimeEntrypoint)};`,
					`export default isPrerender ? prerenderService : runtimeService;`,
				].join('\n');
			},
		},
	};

	const emitter: Plugin = {
		name: '@astrojs/cloudflare:image-service-emitter',
		applyToEnvironment: (env) => env.name === 'ssr',
		buildStart() {
			const entrypoint = options.getBuildServiceEntrypoint();
			if (entrypoint) {
				emitRef = this.emitFile({
					type: 'chunk',
					id: entrypoint,
					name: 'custom-image-service',
				});
			}
		},
		generateBundle() {
			if (emitRef) {
				const fileName = this.getFileName(emitRef);
				// fileName is relative to the output dir — we need an absolute path.
				// The caller (index.ts) will resolve it against config.build.server.
				options.onService(fileName);
			}
		},
	};

	return [interceptor, emitter];
}
