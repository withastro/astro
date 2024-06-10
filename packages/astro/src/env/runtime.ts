import { AstroError, AstroErrorData } from '../core/errors/index.js';
export { validateEnvVariable } from './validators.js';
import { EventEmitter } from 'node:events'

export type GetEnv = (key: string) => string | undefined;

let _getEnv: GetEnv = (key) => process.env[key];

export function setGetEnv(fn: GetEnv, reset = false) {
	_getEnv = fn;

	eventEmitter.emit('setGetEnv', reset);
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

export const eventEmitter = new EventEmitter();
