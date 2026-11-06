import * as z from 'zod/v4';
import type { SvgOptimizer } from './types.js';

export const SvgOptimizerSchema = z.object({
	name: z.string(),
	optimize: z.custom<SvgOptimizer['optimize']>((v) => typeof v === 'function'),
});
