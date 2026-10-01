import type * as zCore from 'zod/v4/core';
import { MissingDependencyError, type ToFormInputFn } from './utils.js';

/**
 * Zod's class hierarchy, resolved by the handler below before anything here can run.
 * It is held at module scope so that the helpers can use `instanceof` freely rather than
 * threading it through every call.
 */
let z: typeof zCore;

export default async function (): Promise<ToFormInputFn> {
	try {
		z ??= await import('zod/v4/core');
	} catch {
		throw new MissingDependencyError('zod');
	}

	return (schema, formData) => {
		// Zod recommends branching on the schema rather than the installed version.
		// https://zod.dev/library-authors#how-to-support-zod-3-and-zod-4-simultaneously
		if (!isZodSchema(schema)) {
			throw new MissingDependencyError('zod@^4');
		}
		const baseSchema = unwrapBaseObjectSchema(schema, formData);
		return baseSchema instanceof z.$ZodObject ? formDataToObject(formData, baseSchema) : formData;
	};
}

function isZodSchema(schema: unknown): schema is zCore.$ZodType {
	return typeof schema === 'object' && schema !== null && '_zod' in schema;
}

/** Transform form data to an object based on a Zod schema. */
function formDataToObject<T extends zCore.$ZodObject>(
	formData: FormData,
	schema: T,
	prefix = '',
): Record<string, unknown> {
	const formKeys = [...formData.keys()];
	const obj: Record<string, unknown> = schema._zod.def.catchall
		? Object.fromEntries(
				[...formData.entries()]
					.filter(([k]) => k.startsWith(prefix))
					.map(([k, v]) => [k.slice(prefix.length), v]),
			)
		: {};
	for (const [key, baseValidator] of Object.entries(schema._zod.def.shape)) {
		const prefixedKey = prefix + key;
		let validator = baseValidator;

		while (
			validator instanceof z.$ZodOptional ||
			validator instanceof z.$ZodNullable ||
			validator instanceof z.$ZodDefault
		) {
			// use default value when key is undefined
			if (validator instanceof z.$ZodDefault && !formDataHasKeyOrPrefix(formKeys, prefixedKey)) {
				obj[key] =
					validator._zod.def.defaultValue instanceof Function
						? validator._zod.def.defaultValue()
						: validator._zod.def.defaultValue;
			}
			validator = validator._zod.def.innerType;
		}

		// Unwrap pipe (from .transform() / .pipe()) to find nested objects
		while (validator instanceof z.$ZodPipe) {
			validator = validator._zod.def.in;
		}

		// Resolve nested discriminatedUnion to the matching variant
		if (validator instanceof z.$ZodDiscriminatedUnion) {
			const typeKey = validator._zod.def.discriminator;
			const typeValue = formData.get(prefixedKey + '.' + typeKey);
			if (typeof typeValue === 'string') {
				const match = validator._zod.def.options.find((option: any) =>
					option.def.shape[typeKey].values.has(typeValue),
				);
				if (match) {
					validator = match;
				}
			}
		}

		if (validator instanceof z.$ZodObject) {
			const nestedPrefix = prefixedKey + '.';
			const hasNestedKeys = formKeys.some((k) => k.startsWith(nestedPrefix));
			if (hasNestedKeys) {
				obj[key] = formDataToObject(formData, validator, nestedPrefix);
			} else if (!(key in obj)) {
				// No nested keys and no default was set — respect optional/nullable
				obj[key] = baseValidator instanceof z.$ZodNullable ? null : undefined;
			}
		} else if (!formData.has(prefixedKey) && key in obj) {
			// continue loop if form input is not found and default value is set
			continue;
		} else if (validator instanceof z.$ZodBoolean) {
			const val = formData.get(prefixedKey);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(prefixedKey);
		} else if (validator instanceof z.$ZodArray) {
			obj[key] = handleFormDataGetAll(prefixedKey, formData, validator);
		} else {
			obj[key] = handleFormDataGet(prefixedKey, formData, validator, baseValidator);
		}
	}
	return obj;
}

/** Check if formKeys contains an exact key or any keys with the given prefix (for nested objects). */
function formDataHasKeyOrPrefix(formKeys: string[], key: string): boolean {
	const prefix = key + '.';
	return formKeys.some((k) => k === key || k.startsWith(prefix));
}

function handleFormDataGetAll(key: string, formData: FormData, validator: zCore.$ZodArray) {
	const entries = Array.from(formData.getAll(key));
	const elementValidator = validator._zod.def.element;
	if (elementValidator instanceof z.$ZodNumber) {
		return entries.map(Number);
	} else if (elementValidator instanceof z.$ZodBoolean) {
		return entries.map((v) => (v === 'true' ? true : v === 'false' ? false : Boolean(v)));
	}
	return entries;
}

function handleFormDataGet(
	key: string,
	formData: FormData,
	validator: unknown,
	baseValidator: unknown,
) {
	const value = formData.get(key);
	if (!value) {
		return baseValidator instanceof z.$ZodOptional ? undefined : null;
	}
	return validator instanceof z.$ZodNumber ? Number(value) : value;
}

function unwrapBaseObjectSchema(schema: zCore.$ZodType, unparsedInput: FormData) {
	if (schema instanceof z.$ZodPipe) {
		return unwrapBaseObjectSchema(schema._zod.def.in, unparsedInput);
	}
	if (schema instanceof z.$ZodDiscriminatedUnion) {
		const typeKey = schema._zod.def.discriminator;
		const typeValue = unparsedInput.get(typeKey);
		if (typeof typeValue !== 'string') return schema;

		const objSchema = schema._zod.def.options.find((option) =>
			(option as any).def.shape[typeKey].values.has(typeValue),
		);
		if (!objSchema) return schema;

		return objSchema;
	}
	return schema;
}
