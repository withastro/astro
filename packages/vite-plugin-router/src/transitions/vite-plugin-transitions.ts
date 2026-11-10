import type * as vite from 'vite';

const VIRTUAL_MODULE_ID = 'astro:transitions';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const VIRTUAL_CLIENT_MODULE_ID = 'astro:transitions/client';
const RESOLVED_VIRTUAL_CLIENT_MODULE_ID = '\0' + VIRTUAL_CLIENT_MODULE_ID;

/**
 * Specifiers the `astro:transitions` and `astro:transitions/client` modules re-export from. They
 * are resolved from the project root, so a host whose projects cannot resolve this package
 * directly (the `astro` CLI under strict pnpm) passes specifiers of its own re-exports.
 */
export interface TransitionsModuleIds {
	/** Server-side transitions API (`fade`, `slide`, …). */
	transitions: string;
	/** The `<ClientRouter />` component. */
	clientRouter: string;
	/** The client router (`navigate`, `supportsViewTransitions`, `transitionEnabledOnThisPage`). */
	router: string;
	types: string;
	events: string;
	swapFunctions: string;
}

const DEFAULT_MODULE_IDS: TransitionsModuleIds = {
	transitions: '@astrojs/runtime/_internal/transitions/index.js',
	clientRouter: '@astrojs/vite-plugin-router/components/ClientRouter.astro',
	router: '@astrojs/vite-plugin-router/_internal/transitions/router.js',
	types: '@astrojs/runtime/_internal/transitions/types.js',
	events: '@astrojs/runtime/_internal/transitions/events.js',
	swapFunctions: '@astrojs/runtime/_internal/transitions/swap-functions.js',
};

/** Serves the `astro:transitions` and `astro:transitions/client` modules. */
export function vitePluginTransitions(moduleIds: Partial<TransitionsModuleIds> = {}): vite.Plugin {
	const ids = { ...DEFAULT_MODULE_IDS, ...moduleIds };
	return {
		name: 'astro:transitions',
		resolveId: {
			filter: {
				id: new RegExp(`^(${VIRTUAL_MODULE_ID}|${VIRTUAL_CLIENT_MODULE_ID})$`),
			},
			handler(id) {
				if (id === VIRTUAL_MODULE_ID) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
				if (id === VIRTUAL_CLIENT_MODULE_ID) {
					return RESOLVED_VIRTUAL_CLIENT_MODULE_ID;
				}
			},
		},
		load: {
			filter: {
				id: new RegExp(`^(${RESOLVED_VIRTUAL_MODULE_ID}|${RESOLVED_VIRTUAL_CLIENT_MODULE_ID})$`),
			},
			handler(id) {
				if (id === RESOLVED_VIRTUAL_MODULE_ID) {
					return {
						code: `
						export * from ${JSON.stringify(ids.transitions)};
						export { default as ClientRouter } from ${JSON.stringify(ids.clientRouter)};
					`,
					};
				}
				if (id === RESOLVED_VIRTUAL_CLIENT_MODULE_ID) {
					return {
						code: `
						export { navigate, supportsViewTransitions, transitionEnabledOnThisPage } from ${JSON.stringify(ids.router)};
						export * from ${JSON.stringify(ids.types)};
						export {
							TransitionBeforePreparationEvent,
							TransitionBeforeSwapEvent,
						} from ${JSON.stringify(ids.events)};
						export { swapFunctions } from ${JSON.stringify(ids.swapFunctions)};
					`,
					};
				}
			},
		},
	};
}
