import type { AstroIntegration } from 'astro';
import * as z from 'zod/v4';
declare const astroDBConfigSchema: z.ZodPrefault<
	z.ZodOptional<
		z.ZodObject<
			{
				mode: z.ZodDefault<
					z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<'node'>, z.ZodLiteral<'web'>]>>
				>;
			},
			z.core.$strip
		>
	>
>;
export type AstroDBConfig = z.infer<typeof astroDBConfigSchema>;
export declare function integration(options?: AstroDBConfig): AstroIntegration[];
export {};
