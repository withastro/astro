import { z } from 'zod';
import type { APIContext } from '../../../@types/astro.js';
import { ApiContextStorage } from '../store.js';
import type { MaybePromise } from '../utils.js';
import { ActionError, ValidationError } from './shared.js';

export * from './shared.js';

export { z } from '../../../../zod.mjs';

export function defineAction<TOutput, TInputSchema extends z.ZodType>({
	input: inputSchema,
	handler,
}: {
	input?: TInputSchema;
	handler: (input: z.infer<TInputSchema>, context: APIContext) => MaybePromise<TOutput>;
}): (input: z.input<TInputSchema> | FormData) => Promise<Awaited<TOutput>> {
	return async (unparsedInput): Promise<Awaited<TOutput>> => {
		const context = ApiContextStorage.getStore()!;

		if (!inputSchema) return await handler(unparsedInput, context);

		if (unparsedInput instanceof FormData) {
			if (!(inputSchema instanceof z.ZodObject)) {
				throw new ActionError({
					status: 'INTERNAL_SERVER_ERROR',
					message:
						'`input` must use a Zod object schema with z.object() when accepting form data.',
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
	for (const [key, baseValidator] of Object.entries(schema.shape)) {
		let validator = baseValidator;
		if (
			baseValidator instanceof z.ZodOptional ||
			baseValidator instanceof z.ZodNullable
		) {
			validator = baseValidator._def.innerType;
		}
		if (validator instanceof z.ZodBoolean) {
			obj[key] = formData.has(key);
		} else if (validator instanceof z.ZodArray) {
			const entries = Array.from(formData.getAll(key));
			const elementValidator = validator._def.type;
			if (elementValidator instanceof z.ZodNumber) {
				obj[key] = entries.map(Number);
			} else if (elementValidator instanceof z.ZodBoolean) {
				obj[key] = entries.map(Boolean);
			} else {
				obj[key] = entries;
			}
		} else if (validator instanceof z.ZodNumber) {
			obj[key] = Number(formData.get(key));
		} else {
			obj[key] = formData.get(key);
		}
	}
	return obj;
}
