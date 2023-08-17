// NOTE: Although this entrypoint is exported, it is internal API and may change at any time.

export {
	Fragment,
	render,
	createAstro,
	createComponent,
	renderComponent,
	renderHead,
	maybeRenderHead,
	unescapeHTML,
	renderSlot,
	mergeSlots,
	addAttribute,
	renderTransition,
	createTransitionScope,
	spreadAttributes,
	defineStyleVars,
	defineScriptVars,
} from '../server/index.js';
