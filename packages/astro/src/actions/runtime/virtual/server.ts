import { z } from 'zod';
import type { APIContext } from '../../../@types/astro.js';
import { ApiContextStorage } from '../store.js';
import type { MaybePromise } from '../utils.js';
import { ActionError, ActionInputError, type SafeResult } from './shared.js';

export * from './shared.js';

export { z } from 'zod';

export function defineAction<TOutput, TInputSchema extends z.ZodType>({
	accept,
	input: inputSchema,
	handler,
}: {
	input?: TInputSchema;
	accept: 'json' | 'form' | 'all';
	handler: (input: z.infer<TInputSchema>, context: APIContext) => MaybePromise<TOutput>;
}): ((input: z.input<TInputSchema> | FormData) => Promise<Awaited<TOutput>>) & {
	safe: (input: z.input<TInputSchema> | FormData) => Promise<SafeResult<TInputSchema, Awaited<TOutput>>>;
} {
	const serverHandler = async (unparsedInput: unknown): Promise<Awaited<TOutput>> => {
		const context = ApiContextStorage.getStore()!;

		if (!inputSchema) return await handler(unparsedInput, context);

		if (unparsedInput instanceof FormData) {
			if (accept === 'json') {
				throw new ActionError({
					code: 'UNSUPPORTED_MEDIA_TYPE',
					message: 'This action only accepts JSON input. To accept form data, set the `accept` option to either `form` or `all`.'
				});
			}
			// TODO: form input schema narrowing
			unparsedInput = upgradeFormData(unparsedInput, inputSchema as any);
		}

		const parsed = inputSchema.safeParse(unparsedInput);
		if (!parsed.success) {
			throw new ActionInputError(parsed.error);
		}
		return await handler(parsed.data, context);
	};

	serverHandler.safe = async (): Promise<SafeResult<TInputSchema, Awaited<TOutput>>> => {
		throw new ActionError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'safe() unexpectedly called on the server. To retrieve action data from Astro frontmatter, use the `Astro.getActionResult()` function.'
		});
	}
	return serverHandler;
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
