import { z } from 'zod';
import { type ActionAPIContext, getApiContext as _getApiContext } from '../store.js';
import { type MaybePromise, hasContentType } from '../utils.js';
import {
	ActionError,
	ActionInputError,
	type ErrorInferenceObject,
	type SafeResult,
	callSafely,
} from './shared.js';

export * from './shared.js';

export { z } from 'zod';

/** @deprecated Access context from the second `handler()` parameter. */
export const getApiContext = _getApiContext;

export type Accept = 'form' | 'json';
export type InputSchema<T extends Accept> = T extends 'form'
	? z.AnyZodObject | z.ZodType<FormData>
	: z.ZodType;

type Handler<TInputSchema, TOutput> = TInputSchema extends z.ZodType
	? (input: z.infer<TInputSchema>, context: ActionAPIContext) => MaybePromise<TOutput>
	: (input: any, context: ActionAPIContext) => MaybePromise<TOutput>;

export type ActionClient<
	TOutput,
	TAccept extends Accept,
	TInputSchema extends InputSchema<TAccept> | undefined,
> = TInputSchema extends z.ZodType
	? ((
			input: TAccept extends 'form' ? FormData : z.input<TInputSchema>
		) => Promise<Awaited<TOutput>>) & {
			safe: (
				input: TAccept extends 'form' ? FormData : z.input<TInputSchema>
			) => Promise<
				SafeResult<
					z.input<TInputSchema> extends ErrorInferenceObject
						? z.input<TInputSchema>
						: ErrorInferenceObject,
					Awaited<TOutput>
				>
			>;
		}
	: ((input?: any) => Promise<Awaited<TOutput>>) & {
			safe: (input?: any) => Promise<SafeResult<never, Awaited<TOutput>>>;
		};

export function defineAction<
	TOutput,
	TAccept extends Accept = 'json',
	TInputSchema extends InputSchema<Accept> | undefined = TAccept extends 'form'
		? // If `input` is omitted, default to `FormData` for forms and `any` for JSON.
			z.ZodType<FormData>
		: undefined,
>({
	accept,
	input: inputSchema,
	handler,
}: {
	input?: TInputSchema;
	accept?: TAccept;
	handler: Handler<TInputSchema, TOutput>;
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

function getFormServerHandler<TOutput, TInputSchema extends InputSchema<'form'>>(
	handler: Handler<TInputSchema, TOutput>,
	inputSchema?: TInputSchema
) {
	return async (unparsedInput: unknown): Promise<Awaited<TOutput>> => {
		if (!(unparsedInput instanceof FormData)) {
			throw new ActionError({
				code: 'UNSUPPORTED_MEDIA_TYPE',
				message: 'This action only accepts FormData.',
			});
		}

		if (!(inputSchema instanceof z.ZodObject)) return await handler(unparsedInput, getApiContext());

		const parsed = await inputSchema.safeParseAsync(formDataToObject(unparsedInput, inputSchema));
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data, getApiContext());
	};
}

function getJsonServerHandler<TOutput, TInputSchema extends InputSchema<'json'>>(
	handler: Handler<TInputSchema, TOutput>,
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

		if (!inputSchema) return await handler(unparsedInput, getApiContext());
		const parsed = await inputSchema.safeParseAsync(unparsedInput);
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data, getApiContext());
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
