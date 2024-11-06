// @ts-check
import { schema } from 'virtual:astro:env/internal';
import {
	createInvalidVariablesError,
	getEnvFieldType,
	validateEnvVariable,
} from 'astro/env/runtime';
import { getEnv } from 'virtual:astro:env/get'

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

