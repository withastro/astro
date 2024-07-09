import { schema } from 'virtual:astro:env/internal';
import {
	createInvalidVariableError,
	getEnv,
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
	throw createInvalidVariableError(key, result.type);
};

setOnSetGetEnv((reset) => {
	// @@ON_SET_GET_ENV@@
});
