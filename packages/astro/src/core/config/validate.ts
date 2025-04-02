import type { AstroConfig } from '../../types/public/config.js';
import { errorMap } from '../errors/index.js';
import { AstroConfigRefinedSchema, createRelativeSchema } from './schemas/index.js';

/** Turn raw config values into normalized values */
export async function validateConfig(
	userConfig: any,
	root: string,
	cmd: string,
): Promise<AstroConfig> {
	const AstroConfigRelativeSchema = createRelativeSchema(cmd, root);

	// First-Pass Validation
	return await validateConfigRefined(
		await AstroConfigRelativeSchema.parseAsync(userConfig, { errorMap }),
	);
}

/**
 * Used twice:
 * - To validate the user config
 * - To validate the config after all integrations (that may have updated it)
 */
export async function validateConfigRefined(updatedConfig: AstroConfig): Promise<AstroConfig> {
	return await AstroConfigRefinedSchema.parseAsync(updatedConfig, { errorMap });
}
