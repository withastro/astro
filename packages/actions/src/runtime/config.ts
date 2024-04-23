import type { APIContext } from 'astro';
import { z } from 'zod';
import { ApiContextStorage } from './utils.js';

export function enhanceProps<T extends Function>(action: T) {
	return {
		type: 'hidden',
		name: '_astroAction',
		value: action.toString(),
	} as const;
}

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
			throw new Response(
				'This action only accepts JSON. To enhance this action to accept form data, add `enhance: true` to your `defineAction()` config.',
				{
					status: 400,
					headers: {
						'Content-Type': 'text/plain',
					},
				}
			);
		}

		if (!inputSchema) return await handler(unparsedInput, context);

		if (enhance && unparsedInput instanceof FormData) {
			if (!(inputSchema instanceof z.ZodObject)) {
				throw new Response(
					'`input` must use a Zod object schema (z.object) when `enhance` is enabled.',
					{
						status: 400,
						headers: {
							'Content-Type': 'text/plain',
						},
					}
				);
			}
			unparsedInput = enhanceFormData(unparsedInput, inputSchema);
		}

		const parsed = inputSchema.safeParse(unparsedInput);
		if (!parsed.success) {
			throw new Response(JSON.stringify(parsed.error), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			});
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
