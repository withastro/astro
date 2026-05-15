import * as z from 'zod/v4';
const SvgOptimizerSchema = z.object({
	name: z.string(),
	optimize: z.custom((v) => typeof v === 'function'),
});
export { SvgOptimizerSchema };
