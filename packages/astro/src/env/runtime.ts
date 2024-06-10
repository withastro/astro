import { AstroError, AstroErrorData } from '../core/errors/index.js';
export { validateEnvVariable } from './validators.js';

export type GetEnv = (key: string) => string | undefined;

let _getEnv: GetEnv = (key) => process.env[key];

export function setGetEnv(fn: GetEnv, reset = false) {
	_getEnv = fn;

	_onSetGetEnv(reset);
}

let _onSetGetEnv = (reset: boolean) => {};

export function setOnSetGetEnv(fn: typeof _onSetGetEnv) {
	_onSetGetEnv = fn;
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
