import type { GetEnv } from '../../env/types.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
export { validateEnvVariable } from '../../env/validators.js';

let _getEnv: GetEnv = (key) => process.env[key];

export function setGetEnv(fn: GetEnv) {
	_getEnv = fn;
}

export function getEnv(...args: Parameters<GetEnv>) {
	return _getEnv(...args);
}

export function createInvalidVariableError(
	...args: Parameters<typeof AstroErrorData.EnvInvalidVariable.message>
) {
	return new AstroError({
		...AstroErrorData.EnvInvalidVariable,
		message: AstroErrorData.EnvInvalidVariable.message(...args),
	});
}
