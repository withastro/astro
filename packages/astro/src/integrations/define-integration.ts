import type { AstroIntegration, AstroIntegrationHooks } from '../@types/astro.js';
import { AstroError, AstroErrorData, errorMap } from '../core/errors/index.js';
import { z } from '../../zod.mjs';

type AstroIntegrationSetupFn<Options extends z.ZodTypeAny> = (params: {
	name: string;
	options: z.output<Options>;
}) => {
	hooks: AstroIntegrationHooks;
};

/** TODO: */
export const defineIntegration = <
	TOptionsSchema extends z.ZodTypeAny = z.ZodNever,
	TSetup extends AstroIntegrationSetupFn<TOptionsSchema> = AstroIntegrationSetupFn<TOptionsSchema>,
>({
	name,
	optionsSchema,
	setup,
}: {
	name: string;
	optionsSchema?: TOptionsSchema;
	setup: TSetup;
}): ((
	...args: [z.input<TOptionsSchema>] extends [never]
		? []
		: undefined extends z.input<TOptionsSchema>
			? [options?: z.input<TOptionsSchema>]
			: [options: z.input<TOptionsSchema>]
) => AstroIntegration & Omit<ReturnType<TSetup>, keyof AstroIntegration>) => {
	return (...args) => {
		const parsedOptions = (optionsSchema ?? z.never().optional()).safeParse(args[0], {
			errorMap,
		});

		if (!parsedOptions.success) {
			throw new AstroError({
				...AstroErrorData.AstroIntegrationInvalidOptions,
				message: AstroErrorData.AstroIntegrationInvalidOptions.message(
					name,
					parsedOptions.error.issues.map((i) => i.message).join('\n')
				),
			});
		}

		const options = parsedOptions.data as z.output<TOptionsSchema>;

		const integration = setup({ name, options }) as ReturnType<TSetup>;

		return {
			name,
			...integration,
		};
	};
};
