import type { HydrationMetadata } from '../hydration.js';

const RenderInstructionSymbol = Symbol.for('astro:render');

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

export type RenderInstruction =
	| RenderDirectiveInstruction
	| RenderHeadInstruction
	| MaybeRenderHeadInstruction
	| RendererHydrationScriptInstruction
	| ServerIslandRuntimeInstruction;

export function createRenderInstruction<T extends RenderInstruction>(instruction: T): T {
	return Object.defineProperty(instruction as T, RenderInstructionSymbol, {
		value: true,
	});
}

export function isRenderInstruction(chunk: any): chunk is RenderInstruction {
	return chunk && typeof chunk === 'object' && chunk[RenderInstructionSymbol];
}
