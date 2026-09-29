/**
 * Turns `formData` into a value the validator's schema can validate.
 *
 * The Standard Schema spec covers validation, but not introspection: there is no
 * portable way to ask a schema "is this field a number?", which is exactly what turning
 * the flat, stringly typed shape of `FormData` into the value a schema expects requires.
 * Each validator therefore contributes its own coercion step, and the spec takes over
 * from there.
 *
 * Implementations should return `formData` untouched when handed a schema they cannot
 * introspect, so that validation — rather than the coercion — reports the mismatch.
 */
export type ToFormInputFn = (schema: unknown, formData: FormData) => unknown;

export const validationMapper = new Map<string, ToFormInputFn>();

export class UnsupportedVendorError extends Error {
	constructor(vendor: string) {
		super(`standard-form: Unsupported schema vendor "${vendor}".`);
	}
}

export class MissingDependencyError extends Error {
	constructor(packageName: string) {
		super(`standard-form: Missing dependencies "${packageName}".`);
	}
}
