import type { AstroRenderer } from 'astro';
import { APP_ENTRYPOINT_MODULE_ID } from './app-entrypoint-id.js';
import { getContainerRenderer } from './container-renderer.js';

export interface VueRendererOptions {
	/**
	 * Module whose default export receives the Vue app of every island before it mounts, to add
	 * plugins or components. Paths starting with `.` are resolved against the project root.
	 */
	appEntrypoint?: string;
}

/**
 * Returns the Vue renderer for `astro({ renderers: [vue()] })` from
 * `@astrojs/vite-plugin-astro`: plain data, applied by `astro()`. Compiling `.vue` files is the
 * job of `@vitejs/plugin-vue`, added to the Vite `plugins` next to `astro()`.
 */
export default function vue({ appEntrypoint }: VueRendererOptions = {}): AstroRenderer {
	// The entrypoints import the app entrypoint through a virtual module of `astro()`.
	const notOptimized = ['@astrojs/vue/server.js', 'vue/server-renderer', APP_ENTRYPOINT_MODULE_ID];
	return {
		...getContainerRenderer(),
		...(appEntrypoint && { appEntrypoint, appEntrypointImporters: /\.vue$/ }),
		optimizeDeps: {
			// `@vitejs/plugin-vue` doesn't add `vue`; pre-bundling it up front prevents a re-optimization
			// when the `vue` import is only encountered later.
			client: { include: ['@astrojs/vue/client.js', 'vue'], exclude: notOptimized },
			server: { include: ['vue'], exclude: notOptimized },
		},
		// The server entrypoint imports a virtual module, which Node can't resolve.
		noExternal: ['@astrojs/vue'],
	};
}

/**
 * Returns the renderer of Vue components written in JSX, compiled by `@vitejs/plugin-vue-jsx`. It
 * uses the entrypoints of `vue()`, under the name the runtime lists among JSX renderers for
 * `client:only`.
 */
export function vueJsxRenderer(): AstroRenderer {
	return { ...getContainerRenderer(), name: '@astrojs/vue (jsx)' };
}
