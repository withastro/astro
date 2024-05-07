import { z } from 'zod';
import { getApiContext } from '../store.js';
import { hasContentType, type MaybePromise } from '../utils.js';
import {
	ActionError,
	ActionInputError,
	callSafely,
	type ErrorInferenceObject,
	type SafeResult,
} from './shared.js';

export * from './shared.js';

export { z } from 'zod';

export { getApiContext } from '../store.js';

export type Accept = 'form' | 'json';
export type InputSchema<T extends Accept> = T extends 'form'
	? z.AnyZodObject | z.ZodType<FormData>
	: z.ZodType;

export type ActionClient<
	TOutput,
	TAccept extends Accept,
	TInputSchema extends InputSchema<TAccept>,
> = ((
	input: TAccept extends 'form' ? FormData : z.input<TInputSchema>
) => Promise<Awaited<TOutput>>) & {
	safe: (
		input: TAccept extends 'form' ? FormData : z.input<TInputSchema>
	) => Promise<
		SafeResult<
			z.infer<TInputSchema> extends ErrorInferenceObject
				? z.infer<TInputSchema>
				: ErrorInferenceObject,
			Awaited<TOutput>
		>
	>;
};

export function defineAction<
	TOutput,
	TAccept extends Accept = 'json',
	TInputSchema extends InputSchema<Accept> = TAccept extends 'form' ? z.ZodType<FormData> : never,
>({
	accept,
	input: inputSchema,
	handler,
}: {
	input?: TInputSchema;
	accept?: TAccept;
	handler: (input: z.infer<TInputSchema>) => MaybePromise<TOutput>;
}): ActionClient<TOutput, TAccept, TInputSchema> {
	const serverHandler =
		accept === 'form'
			? getFormServerHandler(handler, inputSchema)
			: getJsonServerHandler(handler, inputSchema);

	Object.assign(serverHandler, {
		safe: async (unparsedInput: unknown) => {
			return callSafely(() => serverHandler(unparsedInput));
		},
	});
	return serverHandler as ActionClient<TOutput, TAccept, TInputSchema>;
}

function getFormServerHandler<TOutput, TInputSchema extends z.AnyZodObject | z.ZodType<FormData>>(
	handler: (input: z.infer<TInputSchema>) => MaybePromise<TOutput>,
	inputSchema?: TInputSchema
) {
	return async (unparsedInput: unknown): Promise<Awaited<TOutput>> => {
		if (!(unparsedInput instanceof FormData)) {
			throw new ActionError({
				code: 'UNSUPPORTED_MEDIA_TYPE',
				message: 'This action only accepts FormData.',
			});
		}

		if (!(inputSchema instanceof z.ZodObject)) return await handler(unparsedInput);

		const parsed = await inputSchema.safeParseAsync(formDataToObject(unparsedInput, inputSchema));
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data);
	};
}

function getJsonServerHandler<TOutput, TInputSchema extends z.ZodType<unknown>>(
	handler: (input: z.infer<TInputSchema>) => MaybePromise<TOutput>,
	inputSchema?: TInputSchema
) {
	return async (unparsedInput: unknown): Promise<Awaited<TOutput>> => {
		const context = getApiContext();
		const contentType = context.request.headers.get('content-type');
		if (!contentType || !hasContentType(contentType, ['application/json'])) {
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
}

/** Transform form data to an object based on a Zod schema. */
export function formDataToObject<T extends z.AnyZodObject>(
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
			obj[key] = handleFormDataGetAll(key, formData, validator);
		} else {
			obj[key] = handleFormDataGet(key, formData, validator, baseValidator);
		}
	}
	return obj;
}

function handleFormDataGetAll(
	key: string,
	formData: FormData,
	validator: z.ZodArray<z.ZodUnknown>
) {
	const entries = Array.from(formData.getAll(key));
	const elementValidator = validator._def.type;
	if (elementValidator instanceof z.ZodNumber) {
		return entries.map(Number);
	} else if (elementValidator instanceof z.ZodBoolean) {
		return entries.map(Boolean);
	}
	return entries;
}

function handleFormDataGet(
	key: string,
	formData: FormData,
	validator: unknown,
	baseValidator: unknown
) {
	const value = formData.get(key);
	if (!value) {
		return baseValidator instanceof z.ZodOptional ? undefined : null;
	}
	return validator instanceof z.ZodNumber ? Number(value) : value;
}
