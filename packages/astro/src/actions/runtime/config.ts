import { z } from 'zod';
import { ActionError, ValidationError } from './virtual.js';
import type { APIContext } from '../../@types/astro.js';
import { ApiContextStorage } from './store.js';
import type { MaybePromise } from './utils.js';

export function defineAction<TOutput, TInputSchema extends z.ZodType>({
	input: inputSchema,
	handler,
	acceptFormData,
}: {
	input?: TInputSchema;
	handler: (input: z.infer<TInputSchema>, context: APIContext) => MaybePromise<TOutput>;
	acceptFormData?: boolean;
}): (input: z.input<TInputSchema>) => Promise<Awaited<TOutput>> {
	return async (unparsedInput): Promise<Awaited<TOutput>> => {
		const context = ApiContextStorage.getStore()!;
		if (!acceptFormData && unparsedInput instanceof FormData) {
			throw new ActionError({
				status: 'INTERNAL_SERVER_ERROR',
				message:
					'Called an action with a non-JSON body. To acceptFormData an action to accept form data, add `acceptFormData: true` to your `defineAction()` config.',
			});
		}

		if (!inputSchema) return await handler(unparsedInput, context);

		if (acceptFormData && unparsedInput instanceof FormData) {
			if (!(inputSchema instanceof z.ZodObject)) {
				throw new ActionError({
					status: 'INTERNAL_SERVER_ERROR',
					message:
						'`input` must use a Zod object schema (z.object) when `acceptFormData` is enabled.',
				});
			}
			unparsedInput = upgradeFormData(unparsedInput, inputSchema);
		}

		const parsed = inputSchema.safeParse(unparsedInput);
		if (!parsed.success) {
			throw new ValidationError(parsed.error);
		}
		return await handler(parsed.data, context);
	};
}

function upgradeFormData<T extends z.AnyZodObject>(
	formData: FormData,
	schema: T
): Record<string, unknown> {
	const obj: Record<string, unknown> = {};
	for (const [key, validator] of Object.entries(schema.shape)) {
		// TODO: refine, unit test
		if (validator instanceof z.ZodBoolean) {
			obj[key] = formData.has(key);
		} else if (validator instanceof z.ZodArray) {
			obj[key] = Array.from(formData.getAll(key));
		} else if (validator instanceof z.ZodNumber) {
			obj[key] = Number(formData.get(key));
		} else {
			obj[key] = formData.get(key);
		}
	}
	return obj;
}
