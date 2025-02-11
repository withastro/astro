import { z } from 'zod';

export const resolveFontOptionsSchema = z.object({
	weights: z.array(z.string()).nonempty(),
	styles: z.array(z.enum(['normal', 'italic', 'oblique'])).nonempty(),
	subsets: z.array(z.string()).nonempty(),
	fallbacks: z.array(z.string()).nonempty().optional(),
});
