import { renderTemplate } from './astro.js';

export type { RenderInstruction } from './types';
export { renderSlot } from './any.js';
export { renderTemplate, renderAstroComponent, renderToString } from './astro.js';
export { stringifyChunk, Fragment, Renderer } from './common.js';
export { renderComponent } from './component.js';
export { renderHTMLElement } from './dom.js';
export { renderHead, maybeRenderHead } from './head.js';
export { renderPage } from './page.js';
export { addAttribute, defineScriptVars, voidElementNames } from './util.js';

// The callback passed to to $$createComponent
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): ReturnType<typeof renderTemplate> | Response;
	isAstroComponentFactory?: boolean;
}
