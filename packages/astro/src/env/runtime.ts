import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { invalidVariablesToError } from './errors.js';
import { ENV_SYMBOL } from './runtime-constants.js';
import type { ValidationResultInvalid } from './validators.js';
export { validateEnvVariable, getEnvFieldType } from './validators.js';

export type GetEnv = (key: string) => string | undefined;
type OnSetGetEnv = (reset: boolean) => void;

let _getEnv: GetEnv = (key) => {
	const env = (globalThis as any)[ENV_SYMBOL] ?? {};
	return env[key];
};

export function setGetEnv(fn: GetEnv, reset = false) {
	_getEnv = fn;

	_onSetGetEnv(reset);
}

let _onSetGetEnv: OnSetGetEnv = () => {};

export function setOnSetGetEnv(fn: OnSetGetEnv) {
	_onSetGetEnv = fn;
}

export function getEnv(...args: Parameters<GetEnv>) {
	return _getEnv(...args);
}

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
