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
		TransitionBeforePreparationEvent,
		TransitionBeforeSwapEvent,
	} from 'astro/virtual-modules/transitions-events.js';
	export { swapFunctions } from 'astro/virtual-modules/transitions-swap-functions.js';
}
