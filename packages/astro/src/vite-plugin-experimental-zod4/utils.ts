import type * as z4 from 'zod/v4/core';

// Version compatibility check is no longer needed since only z4 is supported
export function checkZodSchemaCompatibility(
	schema: z4.$ZodType,
	_experimentalZod4: boolean,
	_feature: string,
): null {
	// Always returns null since z4 is the only supported version
	return null;
}
