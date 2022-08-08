import { renderTemplate } from './astro.js';

export { renderSlot } from './any.js';
export { renderAstroComponent, renderTemplate, renderToString } from './astro.js';
export { Fragment, Renderer, stringifyChunk } from './common.js';
export { renderComponent } from './component.js';
export { renderHTMLElement } from './dom.js';
export { maybeRenderHead, renderHead } from './head.js';
export { renderPage } from './page.js';
export type { RenderInstruction } from './types';
export { addAttribute, defineScriptVars, voidElementNames } from './util.js';

// The callback passed to to $$createComponent
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): ReturnType<typeof renderTemplate> | Response;
	isAstroComponentFactory?: boolean;
}
