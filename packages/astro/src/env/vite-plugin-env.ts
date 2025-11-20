import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroSettings } from '../types/astro.js';
import {
	CLIENT_VIRTUAL_MODULE_ID,
	INTERNAL_VIRTUAL_MODULE_ID,
	MODULE_TEMPLATE_URL,
	RESOLVED_CLIENT_VIRTUAL_MODULE_ID,
	RESOLVED_INTERNAL_VIRTUAL_MODULE_ID,
	RESOLVED_SERVER_VIRTUAL_MODULE_ID,
	SERVER_VIRTUAL_MODULE_ID,
} from './constants.js';
import type { EnvLoader } from './env-loader.js';
import { type InvalidVariable, invalidVariablesToError } from './errors.js';
import type { EnvSchema } from './schema.js';
import { getEnvFieldType, validateEnvVariable } from './validators.js';

interface AstroEnvPluginParams {
	settings: AstroSettings;
	sync: boolean;
	envLoader: EnvLoader;
}

export function astroEnv({ settings, sync, envLoader }: AstroEnvPluginParams): Plugin {
	const { schema, validateSecrets } = settings.config.env;
	let isBuild: boolean;
	let populated = false;

	return {
		name: 'astro-env-plugin',
		enforce: 'pre',
		config(_, { command }) {
			isBuild = command === 'build';
		},
		buildStart() {
			if (!isBuild || populated) {
				return;
			}

			const loadedEnv = envLoader.get();

			// During the build, we populate process.env so that secrets can work
			for (const [key, value] of Object.entries(loadedEnv)) {
				if (value !== undefined) {
					process.env[key] = value;
				}
			}

			populated = true;
		},
		resolveId(id) {
			if (id === CLIENT_VIRTUAL_MODULE_ID) {
				return RESOLVED_CLIENT_VIRTUAL_MODULE_ID;
			}
			if (id === SERVER_VIRTUAL_MODULE_ID) {
				return RESOLVED_SERVER_VIRTUAL_MODULE_ID;
			}
			if (id === INTERNAL_VIRTUAL_MODULE_ID) {
				return RESOLVED_INTERNAL_VIRTUAL_MODULE_ID;
			}
		},
		load(id, options) {
			if (id === RESOLVED_INTERNAL_VIRTUAL_MODULE_ID) {
				return { code: `export const schema = ${JSON.stringify(schema)};` };
			}

			if (id === RESOLVED_SERVER_VIRTUAL_MODULE_ID && !options?.ssr) {
				throw new AstroError({
					...AstroErrorData.ServerOnlyModule,
					message: AstroErrorData.ServerOnlyModule.message(SERVER_VIRTUAL_MODULE_ID),
				});
			}

			if (id === RESOLVED_CLIENT_VIRTUAL_MODULE_ID || id === RESOLVED_SERVER_VIRTUAL_MODULE_ID) {
				const loadedEnv = envLoader.get();

				const validatedVariables = validatePublicVariables({
					schema,
					loadedEnv,
					validateSecrets,
					sync,
				});
				const { client, server } = getTemplates({
					schema,
					validatedVariables,
					// In dev, we inline process.env to avoid freezing it
					loadedEnv: isBuild ? null : loadedEnv,
				});

				if (id === RESOLVED_CLIENT_VIRTUAL_MODULE_ID) {
					return { code: client };
				}

				if (id === RESOLVED_SERVER_VIRTUAL_MODULE_ID) {
					return { code: server };
				}
			}
		},
	};
}

interface ValidVariable {
	key: string;
	value: any;
	type: string;
	context: 'server' | 'client';
}

function validatePublicVariables({
	schema,
	loadedEnv,
	validateSecrets,
	sync,
}: {
	schema: EnvSchema;
	loadedEnv: Record<string, string>;
	validateSecrets: boolean;
	sync: boolean;
}) {
	const valid: Array<ValidVariable> = [];
	const invalid: Array<InvalidVariable> = [];

	for (const [key, options] of Object.entries(schema)) {
		const variable = loadedEnv[key] === '' ? undefined : loadedEnv[key];

		if (options.access === 'secret' && !validateSecrets) {
			continue;
		}

		const result = validateEnvVariable(variable, options);
		const type = getEnvFieldType(options);
		if (!result.ok) {
			invalid.push({ key, type, errors: result.errors });
			// We don't do anything with validated secrets so we don't store them
		} else if (options.access === 'public') {
			valid.push({ key, value: result.value, type, context: options.context });
		}
	}

	if (invalid.length > 0 && !sync) {
		throw new AstroError({
			...AstroErrorData.EnvInvalidVariables,
			message: AstroErrorData.EnvInvalidVariables.message(invalidVariablesToError(invalid)),
		});
	}

	return valid;
}

let cachedServerTemplate: string | undefined;

function getTemplates({
	schema,
	validatedVariables,
	loadedEnv,
}: {
	schema: EnvSchema;
	validatedVariables: Array<ValidVariable>;
	loadedEnv: Record<string, string> | null;
}) {
	let client = '';
	let server = (cachedServerTemplate ??= readFileSync(MODULE_TEMPLATE_URL, 'utf-8'));
	let onSetGetEnv = '';

	for (const { key, value, context } of validatedVariables) {
		const str = `export const ${key} = ${JSON.stringify(value)};`;
		if (context === 'client') {
			client += str;
		} else {
			server += str;
		}
	}

	for (const [key, options] of Object.entries(schema)) {
		if (!(options.context === 'server' && options.access === 'secret')) {
			continue;
		}

		server += `export let ${key} = _internalGetSecret(${JSON.stringify(key)});\n`;
		onSetGetEnv += `${key} = _internalGetSecret(${JSON.stringify(key)});\n`;
	}

	server = server.replace('// @@ON_SET_GET_ENV@@', onSetGetEnv);
	if (loadedEnv) {
		server = server.replace('// @@GET_ENV@@', `return (${JSON.stringify(loadedEnv)})[key];`);
	} else {
		server = server.replace('// @@GET_ENV@@', 'return _getEnv(key);');
	}

	return {
		client,
		server,
	};
}
