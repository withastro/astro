import { z } from 'zod';
import type { AstroConfig } from '../../types/public/config.js';
import { errorMap } from '../errors/zod-error-map.js';
import { AstroConfigRefinedSchema, createRelativeSchema } from './schemas/index.js';

// Set the error map globally for Zod 4 using z.config()
z.config({
	customError: (iss: any) => {
		try {
			// Call the error map with just the issue object (Zod 4 style)
			// The errorMap expects (issue) signature in Zod 4
			const result = errorMap(iss);
			return typeof result === 'string' ? result : result?.message ?? 'Invalid input';
		} catch (e) {
			console.error('Error in customError - iss code:', iss.code, 'error:', e instanceof Error ? e.message : e);
			return iss.message || 'Invalid input';
		}
	}
});

/** Turn raw config values into normalized values */
export async function validateConfig(
	userConfig: any,
	root: string,
	cmd: string,
): Promise<AstroConfig> {
	const AstroConfigRelativeSchema = createRelativeSchema(cmd, root);

	// First-Pass Validation
	try {
		const result = await AstroConfigRelativeSchema.parseAsync(userConfig);
		console.error('DEBUG: First-pass validation successful');
		return await validateConfigRefined(result);
	} catch (error) {
		console.error('DEBUG: First-pass validation failed:', {
			isZodError: error instanceof z.ZodError,
			errorType: error?.constructor?.name,
			message: error instanceof Error ? error.message : String(error)
		});
		throw error;
	}
}

/**
 * Used twice:
 * - To validate the user config
 * - To validate the config after all integrations (that may have updated it)
 */
export async function validateConfigRefined(updatedConfig: AstroConfig): Promise<AstroConfig> {
	return await AstroConfigRefinedSchema.parseAsync(updatedConfig);
}
