import type { AstroConfig } from '../../types/public/config.js';
import { errorMap } from '../errors/index.js';
import { AstroConfigPostIntegrationsSchema, createRelativeSchema } from './schema.js';

/** Turn raw config values into normalized values */
export async function validateConfig(
	userConfig: any,
	root: string,
	cmd: string,
): Promise<AstroConfig> {
	const AstroConfigRelativeSchema = createRelativeSchema(cmd, root);

	// First-Pass Validation
	return await AstroConfigRelativeSchema.parseAsync(userConfig, { errorMap });
}

export async function validateConfigPostIntegrations(
	updatedConfig: AstroConfig,
): Promise<AstroConfig> {
	return await AstroConfigPostIntegrationsSchema.parseAsync(updatedConfig, { errorMap });
}
