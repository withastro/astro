import type { GetEnv } from '../../env/types.js';
export { validateEnvVariable } from '../../env/validators.js';

let _getEnv: GetEnv = (key) => process.env[key];

export function setGetEnv(fn: GetEnv) {
	_getEnv = fn;
}

export function getEnv(...args: Parameters<GetEnv>) {
	return _getEnv(...args);
}
