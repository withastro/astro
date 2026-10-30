import type * as zCore from 'zod/v4/core';
import { type ToFormInputFn, UnsupportedSchemaError } from './utils.js';

export default async function (): Promise<ToFormInputFn> {
	return (schema, formData) => {
		// Zod recommends branching on the schema rather than the installed version.
		// https://zod.dev/library-authors#how-to-support-zod-3-and-zod-4-simultaneously
		if (!isZodSchema(schema)) {
			throw new UnsupportedSchemaError('zod', 'Zod 4 and higher is required');
		}
		const baseSchema = unwrapBaseObjectSchema(schema, formData);
		return hasZodType<zCore.$ZodObject>(baseSchema, 'object')
			? formDataToObject(formData, baseSchema)
			: formData;
	};
}

function isZodSchema(schema: unknown): schema is zCore.$ZodType {
	return typeof schema === 'object' && schema !== null && '_zod' in schema;
}

/**
 * Narrows `schema` by its Zod kind.
 *
 * The kind lives on `_zod.def.type`, so the coercion can dispatch without importing
 * Zod at runtime. This module ships whenever the form parser is bundled, including in
 * apps that never validate a form with Zod.
 */
function hasZodType<T extends zCore.$ZodType>(
	schema: unknown,
	type: T['_zod']['def']['type'],
): schema is T {
	return isZodSchema(schema) && schema._zod.def.type === type;
}

function isDiscriminatedUnion(schema: zCore.$ZodType): schema is zCore.$ZodDiscriminatedUnion {
	return schema._zod.def.type === 'union' && 'discriminator' in schema._zod.def;
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
			hasZodType<zCore.$ZodOptional>(validator, 'optional') ||
			hasZodType<zCore.$ZodNullable>(validator, 'nullable') ||
			hasZodType<zCore.$ZodDefault>(validator, 'default')
		) {
			// use default value when key is undefined
			if (
				hasZodType<zCore.$ZodDefault>(validator, 'default') &&
				!formDataHasKeyOrPrefix(formKeys, prefixedKey)
			) {
				obj[key] =
					validator._zod.def.defaultValue instanceof Function
						? validator._zod.def.defaultValue()
						: validator._zod.def.defaultValue;
			}
			validator = validator._zod.def.innerType;
		}

		// Unwrap pipe (from .transform() / .pipe()) to find nested objects
		while (hasZodType<zCore.$ZodPipe>(validator, 'pipe')) {
			validator = validator._zod.def.in;
		}

		// Resolve nested discriminatedUnion to the matching variant
		if (isDiscriminatedUnion(validator)) {
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

		if (hasZodType<zCore.$ZodObject>(validator, 'object')) {
			const nestedPrefix = prefixedKey + '.';
			const hasNestedKeys = formKeys.some((k) => k.startsWith(nestedPrefix));
			if (hasNestedKeys) {
				obj[key] = formDataToObject(formData, validator, nestedPrefix);
			} else if (!(key in obj)) {
				// No nested keys and no default was set — respect optional/nullable
				obj[key] = hasZodType<zCore.$ZodNullable>(baseValidator, 'nullable') ? null : undefined;
			}
		} else if (!formData.has(prefixedKey) && key in obj) {
			// continue loop if form input is not found and default value is set
			continue;
		} else if (hasZodType<zCore.$ZodBoolean>(validator, 'boolean')) {
			const val = formData.get(prefixedKey);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(prefixedKey);
		} else if (hasZodType<zCore.$ZodArray>(validator, 'array')) {
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
	if (hasZodType<zCore.$ZodNumber>(elementValidator, 'number')) {
		return entries.map(Number);
	} else if (hasZodType<zCore.$ZodBoolean>(elementValidator, 'boolean')) {
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
		return hasZodType<zCore.$ZodOptional>(baseValidator, 'optional') ? undefined : null;
	}
	return hasZodType<zCore.$ZodNumber>(validator, 'number') ? Number(value) : value;
}

function unwrapBaseObjectSchema(schema: zCore.$ZodType, unparsedInput: FormData) {
	if (hasZodType<zCore.$ZodPipe>(schema, 'pipe')) {
		return unwrapBaseObjectSchema(schema._zod.def.in, unparsedInput);
	}
	if (isDiscriminatedUnion(schema)) {
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
