import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { invalidVariablesToError } from './errors.js';
import type { ValidationResultInvalid } from './validators.js';
export { validateEnvVariable, getEnvFieldType } from './validators.js';

export function createInvalidVariablesError(
	key: string,
	type: string,
	result: ValidationResultInvalid,
) {
	return new AstroError({
		...AstroErrorData.EnvInvalidVariables,
		message: AstroErrorData.EnvInvalidVariables.message(
			invalidVariablesToError([{ key, type, errors: result.errors }]),
		),
	});
}
