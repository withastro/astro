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

	return AstroConfigRefinedSchema.parse(
		await AstroConfigRelativeSchema.parseAsync(userConfig, { errorMap }),
		{ errorMap },
	);
}
