import type { HydrationMetadata } from '../hydration.js';
export type RenderDirectiveInstruction = {
	type: 'directive';
	hydration: HydrationMetadata;
};
export type RenderHeadInstruction = {
	type: 'head';
};
/**
 * Render a renderer-specific hydration script before the first component of that
 * framework
 */
export type RendererHydrationScriptInstruction = {
	type: 'renderer-hydration-script';
	rendererName: string;
	render: () => string;
};
export type MaybeRenderHeadInstruction = {
	type: 'maybe-head';
};
export type ServerIslandRuntimeInstruction = {
	type: 'server-island-runtime';
};
export type RenderScriptInstruction = {
	type: 'script';
	id: string;
	content: string;
};
export type TemplateEnterInstruction = {
	type: 'template-enter';
};
export type TemplateExitInstruction = {
	type: 'template-exit';
};
export type RenderInstruction =
	| RenderDirectiveInstruction
	| RenderHeadInstruction
	| MaybeRenderHeadInstruction
	| RendererHydrationScriptInstruction
	| ServerIslandRuntimeInstruction
	| RenderScriptInstruction
	| TemplateEnterInstruction
	| TemplateExitInstruction;
export declare function createRenderInstruction<T extends RenderInstruction>(instruction: T): T;
export declare function isRenderInstruction(chunk: any): chunk is RenderInstruction;
