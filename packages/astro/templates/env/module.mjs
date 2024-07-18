// @ts-check
import { schema } from 'virtual:astro:env/internal';
import {
	createInvalidVariablesError,
	getEnv,
	getEnvFieldType,
	setOnSetGetEnv,
	validateEnvVariable,
} from 'astro/env/runtime';

export const getSecret = (key) => {
	return getEnv(key);
};

const _internalGetSecret = (key) => {
	const rawVariable = getEnv(key);
	const variable = rawVariable === '' ? undefined : rawVariable;
	const options = schema[key];

	const result = validateEnvVariable(variable, options);
	if (result.ok) {
		return result.value;
	}
	const type = getEnvFieldType(options);
	throw createInvalidVariablesError(key, type, result);
};

setOnSetGetEnv((reset) => {
	// @@ON_SET_GET_ENV@@
});
