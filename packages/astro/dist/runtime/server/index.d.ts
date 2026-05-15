export { createComponent } from './astro-component.js';
export { createAstro } from './astro-global.js';
export { renderEndpoint } from './endpoint.js';
export {
	escapeHTML,
	HTMLBytes,
	HTMLString,
	isHTMLString,
	markHTMLString,
	unescapeHTML,
} from './escape.js';
export { renderJSX } from './jsx.js';
export type {
	AstroComponentFactory,
	AstroComponentInstance,
	ComponentSlots,
	RenderInstruction,
} from './render/index.js';
export {
	addAttribute,
	createHeadAndContent,
	defineScriptVars,
	Fragment,
	maybeRenderHead,
	Renderer as Renderer,
	renderComponent,
	renderHead,
	renderHTMLElement,
	renderPage,
	renderScript,
	renderScriptElement,
	renderSlot,
	renderSlotToString,
	renderTemplate as render,
	renderTemplate,
	renderToString,
	renderUniqueStylesheet,
	voidElementNames,
} from './render/index.js';
export type { ServerIslandComponent } from './render/server-islands.js';
export { templateEnter, templateExit } from './render/template-depth.js';
export { createTransitionScope, renderTransition } from './transition.js';
export declare function mergeSlots(...slotted: unknown[]): Record<string, () => any>;
export declare function spreadAttributes(
	values?: Record<any, any>,
	_name?: string,
	{
		class: scopedClassName,
	}?: {
		class?: string;
	},
): any;
export declare function defineStyleVars(defs: Record<any, any> | Record<any, any>[]): any;
