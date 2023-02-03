import type { SSRResult } from '../../../@types/astro';
import type { HydrationMetadata } from '../hydration.js';

export type RenderDirectiveInstruction = {
	type: 'directive';
	result: SSRResult;
	hydration: HydrationMetadata;
};

export type RenderHeadInstruction = {
	type: 'head';
	result: SSRResult;
};

export type RenderInstruction = RenderDirectiveInstruction | RenderHeadInstruction;
