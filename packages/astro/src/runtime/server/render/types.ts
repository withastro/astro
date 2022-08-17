import type { SSRResult } from '../../../@types/astro';
import type { HydrationMetadata } from '../hydration.js';

export interface RenderInstruction {
	type: 'directive';
	result: SSRResult;
	hydration: HydrationMetadata;
}
