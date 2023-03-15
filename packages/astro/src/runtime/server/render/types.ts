import type { SSRResult } from '../../../@types/astro';
import type { HydrationMetadata } from '../hydration.js';

export type RenderDirectiveInstruction = {
	type: 'directive';
	result: SSRResult;
	hydration: HydrationMetadata;
};

export type RenderSuspenseInstruction = {
	type: 'suspense';
	result: SSRResult;
	id: string;
	content: any;
};

export type RenderHeadInstruction = {
	type: 'head';
	result: SSRResult;
};

export type MaybeRenderHeadInstruction = {
	type: 'maybe-head';
	result: SSRResult;
	scope: number;
};

export type RenderInstruction =
	| RenderDirectiveInstruction
	| RenderSuspenseInstruction
	| RenderHeadInstruction
	| MaybeRenderHeadInstruction;
