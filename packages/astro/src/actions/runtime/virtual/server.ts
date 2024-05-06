import { z } from 'zod';
import { getApiContext } from '../store.js';
import type { MaybePromise } from '../utils.js';
import {
	ActionError,
	ActionInputError,
	type ErrorInferenceObject,
	type SafeResult,
} from './shared.js';

export * from './shared.js';

export { z } from 'zod';

export { getApiContext } from '../store.js';

export function defineFormAction<
	TOutput,
	TInputSchema extends z.AnyZodObject | z.ZodType<FormData> = z.ZodType<FormData>,
>({
	input: inputSchema,
	handler,
}: {
	input?: TInputSchema;
	handler: (input: z.infer<TInputSchema>) => MaybePromise<TOutput>;
}): ((input: FormData) => Promise<Awaited<TOutput>>) & {
	safe: (
		input: FormData
	) => Promise<
		SafeResult<
			z.infer<TInputSchema> extends ErrorInferenceObject
				? z.infer<TInputSchema>
				: ErrorInferenceObject,
			Awaited<TOutput>
		>
	>;
} {
	const serverHandler = async (unparsedInput: unknown): Promise<Awaited<TOutput>> => {
		getApiContext();
		if (!(unparsedInput instanceof FormData)) {
			throw new ActionError({
				code: 'UNSUPPORTED_MEDIA_TYPE',
				message: 'This action only accepts FormData.',
			});
		}

		if (!inputSchema || !(inputSchema instanceof z.ZodObject)) return await handler(unparsedInput);

		const parsed = await inputSchema.safeParseAsync(upgradeFormData(unparsedInput, inputSchema));
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data);
	};

	serverHandler.safe = async (): Promise<SafeResult<TInputSchema, Awaited<TOutput>>> => {
		throw new ActionError({
			code: 'INTERNAL_SERVER_ERROR',
			message:
				'safe() unexpectedly called on the server. To retrieve action data from Astro frontmatter, use the `Astro.getActionResult()` function.',
		});
	};
	return serverHandler;
}

export function defineAction<TOutput, TInputSchema extends z.ZodType>({
	input: inputSchema,
	handler,
}: {
	input?: TInputSchema;
	handler: (input: z.infer<TInputSchema>) => MaybePromise<TOutput>;
}): ((input: z.input<TInputSchema>) => Promise<Awaited<TOutput>>) & {
	safe: (
		input: z.input<TInputSchema>
	) => Promise<
		SafeResult<
			z.infer<TInputSchema> extends ErrorInferenceObject
				? z.infer<TInputSchema>
				: ErrorInferenceObject,
			Awaited<TOutput>
		>
	>;
} {
	const serverHandler = async (unparsedInput: unknown): Promise<Awaited<TOutput>> => {
		const context = getApiContext();
		if (context.request.headers.get('ContentType') !== 'application/json') {
			throw new ActionError({
				code: 'UNSUPPORTED_MEDIA_TYPE',
				message: 'This action only accepts JSON.',
			});
		}

		if (!inputSchema) return await handler(unparsedInput);

		const parsed = await inputSchema.safeParseAsync(unparsedInput);
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data);
	};

	serverHandler.safe = async (): Promise<SafeResult<TInputSchema, Awaited<TOutput>>> => {
		throw new ActionError({
			code: 'INTERNAL_SERVER_ERROR',
			message:
				'safe() unexpectedly called on the server. To retrieve action data from Astro frontmatter, use the `Astro.getActionResult()` function.',
		});
	};
	return serverHandler;
}

function upgradeFormData<T extends z.AnyZodObject>(
	formData: FormData,
	schema: T
): Record<string, unknown> {
	const obj: Record<string, unknown> = {};
	for (const [key, baseValidator] of Object.entries(schema.shape)) {
		let validator = baseValidator;
		if (baseValidator instanceof z.ZodOptional || baseValidator instanceof z.ZodNullable) {
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
