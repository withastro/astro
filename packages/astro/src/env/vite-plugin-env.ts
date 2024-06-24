import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv, type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import {
	MODULE_TEMPLATE_URL,
	VIRTUAL_MODULES_IDS,
	VIRTUAL_MODULES_IDS_VALUES,
} from './constants.js';
import type { EnvSchema } from './schema.js';
import { validateEnvVariable } from './validators.js';

// TODO: reminders for when astro:env comes out of experimental
// Types should always be generated (like in types/content.d.ts). That means the client module will be empty
// and server will only contain getSecret for unknown variables. Then, specifying a schema should only add
// variables as needed. For secret variables, it will only require specifying SecretValues and it should get
// merged with the static types/content.d.ts

interface AstroEnvVirtualModPluginParams {
	settings: AstroSettings;
	mode: 'dev' | 'build' | string;
	fs: typeof fsMod;
	sync: boolean | undefined;
}

export function astroEnv({
	settings,
	mode,
	fs,
	sync = false,
}: AstroEnvVirtualModPluginParams): Plugin | undefined {
	if (!settings.config.experimental.env || sync) {
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
				''
			);
			for (const [key, value] of Object.entries(loadedEnv)) {
				if (value !== undefined) {
					process.env[key] = value;
				}
			}

			const validatedVariables = validatePublicVariables({ schema, loadedEnv });

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
}: {
	schema: EnvSchema;
	loadedEnv: Record<string, string>;
}) {
	const valid: Array<{ key: string; value: any; type: string; context: 'server' | 'client' }> = [];
	const invalid: Array<{ key: string; type: string }> = [];

	for (const [key, options] of Object.entries(schema)) {
		if (options.access !== 'public') {
			continue;
		}
		const variable = loadedEnv[key];
		const result = validateEnvVariable(variable === '' ? undefined : variable, options);
		if (result.ok) {
			valid.push({ key, value: result.value, type: result.type, context: options.context });
		} else {
			invalid.push({ key, type: result.type });
		}
	}

	if (invalid.length > 0) {
		throw new AstroError({
			...AstroErrorData.EnvInvalidVariables,
			message: AstroErrorData.EnvInvalidVariables.message(
				invalid.map(({ key, type }) => `Variable ${key} is not of type: ${type}.`).join('\n')
			),
		});
	}

	return valid;
}

function getTemplates(
	schema: EnvSchema,
	fs: typeof fsMod,
	validatedVariables: ReturnType<typeof validatePublicVariables>
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
