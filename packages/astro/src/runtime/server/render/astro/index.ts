export type { AstroComponentFactory } from './factory';
export { isAstroComponentFactory, renderToString } from './factory.js';
export { createHeadAndContent, isHeadAndContent } from './head-and-content.js';
export type { AstroComponentInstance, ComponentSlots, ComponentSlotsWithValues } from './instance';
export { createAstroComponentInstance, isAstroComponentInstance } from './instance.js';
export {
	isRenderTemplateResult,
	renderAstroTemplateResult,
	renderTemplate,
} from './render-template.js';
