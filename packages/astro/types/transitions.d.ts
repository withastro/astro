declare module 'astro:transitions' {
	export * from 'astro/virtual-modules/transitions.js';
	export { default as ClientRouter } from 'astro/components/ClientRouter.astro';
}

declare module 'astro:transitions/client' {
	export {
		navigate,
		supportsViewTransitions,
		transitionEnabledOnThisPage,
	} from 'astro/virtual-modules/transitions-router.js';
	export * from 'astro/virtual-modules/transitions-types.js';
	export {
		TRANSITION_BEFORE_PREPARATION,
		isTransitionBeforePreparationEvent,
		TransitionBeforePreparationEvent,
		TRANSITION_AFTER_PREPARATION,
		TRANSITION_BEFORE_SWAP,
		isTransitionBeforeSwapEvent,
		TransitionBeforeSwapEvent,
		TRANSITION_AFTER_SWAP,
		TRANSITION_PAGE_LOAD,
	} from 'astro/virtual-modules/transitions-events.js';
	export { swapFunctions } from 'astro/virtual-modules/transitions-swap-functions.js';
}
