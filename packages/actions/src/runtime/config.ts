import type { APIContext } from 'astro';
import { z } from 'zod';
import { ApiContextStorage } from './utils.js';
import { ActionError, ValidationError } from './virtual.js';

type MaybePromise<T> = T | Promise<T>;

export function defineAction<TOutput, TInputSchema extends z.ZodType>({
	input: inputSchema,
	handler,
	enhance,
}: {
	input?: TInputSchema;
	handler: (input: z.infer<TInputSchema>, context: APIContext) => MaybePromise<TOutput>;
	enhance?: boolean;
}): (input: z.input<TInputSchema>) => Promise<Awaited<TOutput>> {
	return async (unparsedInput): Promise<Awaited<TOutput>> => {
		const context = ApiContextStorage.getStore()!;
		const ContentType = context.request.headers.get('content-type');
		if (!enhance && (ContentType !== 'application/json' || unparsedInput instanceof FormData)) {
			// TODO: prettify dev server error
			throw new ActionError({
				status: 'BAD_REQUEST',
				message:
					'This action only accepts JSON. To enhance this action to accept form data, add `enhance: true` to your `defineAction()` config.',
			});
		}

		if (!inputSchema) return await handler(unparsedInput, context);

		if (enhance && unparsedInput instanceof FormData) {
			if (!(inputSchema instanceof z.ZodObject)) {
				throw new ActionError({
					status: 'BAD_REQUEST',
					message: '`input` must use a Zod object schema (z.object) when `enhance` is enabled.',
				});
			}
			unparsedInput = enhanceFormData(unparsedInput, inputSchema);
		}

		const parsed = inputSchema.safeParse(unparsedInput);
		if (!parsed.success) {
			throw new ValidationError(parsed.error);
		}
		return await handler(parsed.data, context);
	};
}

function enhanceFormData<T extends z.AnyZodObject>(
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
