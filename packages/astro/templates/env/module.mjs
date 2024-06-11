import { schema } from 'virtual:astro:env/internal';
import { createInvalidVariableError, getEnv, validateEnvVariable } from 'astro/env/runtime';

export const getSecret = (key) => {
	const rawVariable = getEnv(key);
	const variable = rawVariable === '' ? undefined : rawVariable;
	const options = schema[key];

	if (!options) {
		return variable;
	}

	const result = validateEnvVariable(variable, options);
	if (result.ok) {
		return result.value;
	}
	throw createInvalidVariableError(key, result.type);
};
