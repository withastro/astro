import * as vite from 'vite';

const virtualModuleId = 'astro:transitions';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const virtualClientModuleId = 'astro:transitions/client';
const resolvedVirtualClientModuleId = '\0' + virtualClientModuleId;

// The virtual module for the astro:transitions namespace
export default function astroTransitions(): vite.Plugin {
	return {
		name: 'astro:transitions',
		async resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
			if (id === virtualClientModuleId) {
				return resolvedVirtualClientModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
				export * from "astro/transitions";
				export { default as ViewTransitions } from "astro/components/ViewTransitions.astro";
			`;
			}
			if (id === resolvedVirtualClientModuleId) {
				return `
				export { navigate } from "astro/transitions/router";
				export * from "astro/transitions/types";
				export { supportsViewTransitions, supportsNavigationAPI, transitionEnabledOnThisPage, getFallback } from "astro/transitions/util";
				export {
					TRANSITION_PREPARE, isTransitionPrepareEvent, TransitionPrepareEvent, TRANSITION_BEFORE_SWAP, isTransitionBeforeSwapEvent, TransitionBeforeSwapEvent, 
					TRANSITION_AFTER_SWAP, TRANSITION_PAGE_LOAD
				} from "astro/transitions/events";
			`;
			}
		},
	};
}
