import { errorMap } from '../errors/index.js';
import { AstroConfigRefinedSchema, createRelativeSchema } from './schemas/index.js';
async function validateConfig(userConfig, root, cmd) {
	const AstroConfigRelativeSchema = createRelativeSchema(cmd, root);
	return await validateConfigRefined(
		await AstroConfigRelativeSchema.parseAsync(userConfig, {
			error(issue) {
				if (issue.path?.[0] === 'experimental') {
					return {
						message: `Invalid or outdated experimental feature.
Check for incorrect spelling or outdated Astro version.
See https://docs.astro.build/en/reference/experimental-flags/ for a list of all current experiments.`,
					};
				}
				return errorMap(issue);
			},
		}),
	);
}
async function validateConfigRefined(updatedConfig) {
	return await AstroConfigRefinedSchema.parseAsync(updatedConfig, { error: errorMap });
}
export { validateConfig, validateConfigRefined };
