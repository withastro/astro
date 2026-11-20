import type { StandardSchemaV1 } from '@standard-schema/spec';
import { getToFormInputFn } from './vendors/index.js';
import { type ToFormInputFn, validationMapper } from './vendors/utils.js';

/**
 * Validates `FormData` against a Standard Schema.
 *
 * `FormData` is flat and stringly typed, so the entries are first coerced into the shape
 * the schema expects — nested objects from dotted keys, numbers, booleans, arrays,
 * defaults — by the handler for the schema's validator, then handed to the schema itself.
 */
export async function parseFormData<TSchema extends StandardSchemaV1>(
	schema: TSchema,
	formData: FormData,
): Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<TSchema>>> {
	const fn = await getToFormInputFn(schema['~standard'].vendor);
	return await schema['~standard'].validate(fn(schema, formData));
}

export function loadVendor(vendor: string, fn: ToFormInputFn) {
	validationMapper.set(vendor, fn);
}
