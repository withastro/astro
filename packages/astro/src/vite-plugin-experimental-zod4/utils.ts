import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4/core';
import { AstroError } from '../core/errors/errors.js';
import { InvalidZodSchemaVersion } from '../core/errors/errors-data.js';

export function checkZodSchemaCompatibility(
	schema: z3.ZodType | z4.$ZodType,
	experimentalZod4: boolean,
	feature: string,
): AstroError | null {
	if ('_zod' in schema && !experimentalZod4) {
		return new AstroError({
			...InvalidZodSchemaVersion,
			message: InvalidZodSchemaVersion.message(feature, 4),
		});
	}

	if (!('_zod' in schema) && experimentalZod4) {
		return new AstroError({
			...InvalidZodSchemaVersion,
			message: InvalidZodSchemaVersion.message(feature, 3),
		});
	}

	return null;
}
