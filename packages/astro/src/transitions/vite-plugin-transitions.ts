import type * as vite from 'vite';
import type { AstroSettings } from '../types/astro.js';

const VIRTUAL_MODULE_ID = 'astro:transitions';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const VIRTUAL_CLIENT_MODULE_ID = 'astro:transitions/client';
const RESOLVED_VIRTUAL_CLIENT_MODULE_ID = '\0' + VIRTUAL_CLIENT_MODULE_ID;

// The virtual module for the astro:transitions namespace
export default function astroTransitions({ settings }: { settings: AstroSettings }): vite.Plugin {
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
						export * from "astro/virtual-modules/transitions.js";
						export { default as ClientRouter } from "astro/components/ClientRouter.astro";
					`,
					};
				}
				if (id === RESOLVED_VIRTUAL_CLIENT_MODULE_ID) {
					return {
						code: `
						export { navigate, supportsViewTransitions, transitionEnabledOnThisPage } from "astro/virtual-modules/transitions-router.js";
						export * from "astro/virtual-modules/transitions-types.js";
						export {
							TRANSITION_BEFORE_PREPARATION, isTransitionBeforePreparationEvent, TransitionBeforePreparationEvent,
							TRANSITION_AFTER_PREPARATION,
							TRANSITION_BEFORE_SWAP, isTransitionBeforeSwapEvent, TransitionBeforeSwapEvent,
							TRANSITION_AFTER_SWAP, TRANSITION_PAGE_LOAD
						} from "astro/virtual-modules/transitions-events.js";
						export { swapFunctions } from "astro/virtual-modules/transitions-swap-functions.js";
					`,
					};
				}
			},
		},
		transform: {
			filter: {
				id: /ClientRouter\.astro.*\.ts$/,
			},
			handler(code) {
				const prefetchDisabled = settings.config.prefetch === false;
				return code.replace('__PREFETCH_DISABLED__', JSON.stringify(prefetchDisabled));
			},
		},
	};
}
