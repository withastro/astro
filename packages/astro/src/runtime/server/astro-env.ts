import type { GetEnv } from '../../env/types.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
export { validateEnvVariable } from '../../env/validators.js';

export type { GetEnv };

let _getEnv: GetEnv = (key) => process.env[key];

export const unimplementedAdapterGetEnv: GetEnv = () => {
	throw new AstroError(AstroErrorData.EnvUnsupportedGetSecret);
};

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

export function overrideProcessEnv({
	// Otherwise eslint isn't happy
	getEnv: __getEnv,
	variables,
}: {
	getEnv: GetEnv;
	variables: Array<{ destKey: string; srcKey?: string; default?: string }>;
}) {
	for (const { destKey, srcKey, default: defaultValue } of variables) {
		const value = __getEnv(srcKey ?? destKey);
		if (value !== undefined) {
			process.env[destKey] = value ?? defaultValue;
		}
	}
}
