import { schema } from 'virtual:astro:env/internal';
import {
	createInvalidVariableError,
	getEnv,
	setOnSetGetEnv,
	validateEnvVariables,
	getEnvFieldType
} from 'astro/env/runtime';

export const getSecret = (key) => {
	return getEnv(key);
};

const _internalGetSecret = (key) => {
	const rawVariable = getEnv(key);
	const variable = rawVariable === '' ? undefined : rawVariable;
	const options = schema[key];

	const result = validateEnvVariables(variable, options);
	if (result.ok) {
		return result.value;
	}
	const type = getEnvFieldType(options)
	throw createInvalidVariableError(key, type, result);
};

setOnSetGetEnv((reset) => {
	// @@ON_SET_GET_ENV@@
});
