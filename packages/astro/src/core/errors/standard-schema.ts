import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { $ZodErrorMap, $ZodType } from 'zod/v4/core';

/** Whether a value implements the [Standard Schema](https://standardschema.dev) interface. */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
	return (
		typeof value === 'object' &&
		value !== null &&
		'~standard' in value &&
		typeof (value as StandardSchemaV1)['~standard']?.validate === 'function'
	);
}

export async function validateSchema(
	schema: StandardSchemaV1,
	input: unknown,
	errorMap?: $ZodErrorMap,
): Promise<StandardSchemaV1.Result<unknown>> {
	if (schema['~standard'].vendor === 'zod' && '_zod' in schema) {
		const { safeParseAsync } = await import('zod/v4/core');
		const result = await safeParseAsync(schema as $ZodType, input, { error: errorMap });
		return result.success ? { value: result.data } : { issues: result.error.issues };
	}
	return schema['~standard'].validate(input);
}

/**
 * Renders the path of a [Standard Schema](https://standardschema.dev) issue as a dotted
 * property path. Segments are either keys or `{ key }` objects, depending on the validator.
 */
export function formatIssuePath(path: StandardSchemaV1.Issue['path']): string {
	return (path ?? [])
		.map((segment) => String(typeof segment === 'object' ? segment.key : segment))
		.join('.');
}

/**
 * Formats validation issues from any Standard Schema validator into the bulleted list used
 * by Astro's schema errors.
 */
export function formatSchemaIssues(issues: readonly StandardSchemaV1.Issue[]): Array<string> {
	return issues.map((issue) => `  **${formatIssuePath(issue.path)}**: ${issue.message}`);
}
