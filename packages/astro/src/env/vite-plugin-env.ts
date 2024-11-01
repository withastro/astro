import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type Plugin, loadEnv } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import {
	MODULE_TEMPLATE_URL,
	VIRTUAL_MODULES_IDS,
	VIRTUAL_MODULES_IDS_VALUES,
} from './constants.js';
import { type InvalidVariable, invalidVariablesToError } from './errors.js';
import type { EnvSchema } from './schema.js';
import { getEnvFieldType, validateEnvVariable } from './validators.js';

interface AstroEnvVirtualModPluginParams {
	settings: AstroSettings;
	mode: 'dev' | 'build' | string;
	fs: typeof fsMod;
	sync: boolean;
}

export function astroEnv({
	settings,
	mode,
	fs,
	sync,
}: AstroEnvVirtualModPluginParams): Plugin | undefined {
	if (!settings.config.experimental.env) {
		return;
	}
	const schema = settings.config.experimental.env.schema ?? {};

	let templates: { client: string; server: string; internal: string } | null = null;

	return {
		name: 'astro-env-plugin',
		enforce: 'pre',
		buildStart() {
			const loadedEnv = loadEnv(
				mode === 'dev' ? 'development' : 'production',
				fileURLToPath(settings.config.root),
				'',
			);
			for (const [key, value] of Object.entries(loadedEnv)) {
				if (value !== undefined) {
					process.env[key] = value;
				}
			}

			const validatedVariables = validatePublicVariables({
				schema,
				loadedEnv,
				validateSecrets: settings.config.experimental.env?.validateSecrets ?? false,
				sync,
			});

			templates = {
				...getTemplates(schema, fs, validatedVariables),
				internal: `export const schema = ${JSON.stringify(schema)};`,
			};
		},
		buildEnd() {
			templates = null;
		},
		resolveId(id) {
			if (VIRTUAL_MODULES_IDS_VALUES.has(id)) {
				return resolveVirtualModuleId(id);
			}
		},
		load(id, options) {
			if (id === resolveVirtualModuleId(VIRTUAL_MODULES_IDS.client)) {
				return templates!.client;
			}
			if (id === resolveVirtualModuleId(VIRTUAL_MODULES_IDS.server)) {
				if (options?.ssr) {
					return templates!.server;
				}
				throw new AstroError({
					...AstroErrorData.ServerOnlyModule,
					message: AstroErrorData.ServerOnlyModule.message(VIRTUAL_MODULES_IDS.server),
				});
			}
			if (id === resolveVirtualModuleId(VIRTUAL_MODULES_IDS.internal)) {
				return templates!.internal;
			}
		},
	};
}

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`;
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
	const valid: Array<{ key: string; value: any; type: string; context: 'server' | 'client' }> = [];
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

function getTemplates(
	schema: EnvSchema,
	fs: typeof fsMod,
	validatedVariables: ReturnType<typeof validatePublicVariables>,
) {
	let client = '';
	let server = fs.readFileSync(MODULE_TEMPLATE_URL, 'utf-8');
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
		onSetGetEnv += `${key} = reset ? undefined : _internalGetSecret(${JSON.stringify(key)});\n`;
	}

	server = server.replace('// @@ON_SET_GET_ENV@@', onSetGetEnv);

	return {
		client,
		server,
	};
}
