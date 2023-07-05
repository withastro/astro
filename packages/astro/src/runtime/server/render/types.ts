import type { HydrationMetadata } from '../hydration.js';

export type RenderDirectiveInstruction = {
	type: 'directive';
	hydration: HydrationMetadata;
};

export type RenderHeadInstruction = {
	type: 'head';
};

export type MaybeRenderHeadInstruction = {
	type: 'maybe-head';
};

export type RenderInstruction =
	| RenderDirectiveInstruction
	| RenderHeadInstruction
	| MaybeRenderHeadInstruction;
