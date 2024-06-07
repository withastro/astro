import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type Plugin, loadEnv } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import {
	ENV_TYPES_FILE,
	MODULE_TEMPLATE_URL,
	TYPES_TEMPLATE_URL,
	VIRTUAL_MODULES_IDS,
	VIRTUAL_MODULES_IDS_VALUES,
} from './constants.js';
import type { EnvSchema } from './schema.js';
import { getEnvFieldType, validateEnvVariable } from './validators.js';

// TODO: reminders for when astro:env comes out of experimental
// Types should always be generated (like in types/content.d.ts). That means the client module will be empty
// and server will only contain getSecret for unknown variables. Then, specifying a schema should only add
// variables as needed. For secret variables, it will only require specifying SecretValues and it should get
// merged with the static types/content.d.ts

interface AstroEnvVirtualModPluginParams {
	settings: AstroSettings;
	mode: 'dev' | 'build' | string;
	fs: typeof fsMod;
}

export function astroEnv({
	settings,
	mode,
	fs,
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
				''
			);
			for (const [key, value] of Object.entries(loadedEnv)) {
				if (value !== undefined) {
					process.env[key] = value;
				}
			}

			const validatedVariables = validatePublicVariables({ schema, loadedEnv });

			const clientTemplates = getClientTemplates({ validatedVariables });
			const serverTemplates = getServerTemplates({ validatedVariables, schema, fs });

			templates = {
				client: clientTemplates.module,
				server: serverTemplates.module,
				internal: `export const schema = ${JSON.stringify(schema)};`,
			};
			generateDts({
				settings,
				fs,
				content: getDts({
					fs,
					clientPublic: clientTemplates.types,
					serverPublic: serverTemplates.types.public,
					serverSecret: serverTemplates.types.secret,
				}),
			});
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

function generateDts({
	content,
	settings,
	fs,
}: {
	content: string;
	settings: AstroSettings;
	fs: typeof fsMod;
}) {
	fs.mkdirSync(settings.dotAstroDir, { recursive: true });
	fs.writeFileSync(new URL(ENV_TYPES_FILE, settings.dotAstroDir), content, 'utf-8');
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

function getDts({
	clientPublic,
	serverPublic,
	serverSecret,
	fs,
}: {
	clientPublic: string;
	serverPublic: string;
	serverSecret: string;
	fs: typeof fsMod;
}) {
	const template = fs.readFileSync(TYPES_TEMPLATE_URL, 'utf-8');

	return template
		.replace('// @@CLIENT@@', clientPublic)
		.replace('// @@SERVER@@', serverPublic)
		.replace('// @@SECRET_VALUES@@', serverSecret);
}

function getClientTemplates({
	validatedVariables,
}: {
	validatedVariables: ReturnType<typeof validatePublicVariables>;
}) {
	let module = '';
	let types = '';

	for (const { key, type, value } of validatedVariables.filter((e) => e.context === 'client')) {
		module += `export const ${key} = ${JSON.stringify(value)};`;
		types += `export const ${key}: ${type};	\n`;
	}

	return {
		module,
		types,
	};
}

function getServerTemplates({
	validatedVariables,
	schema,
	fs,
}: {
	validatedVariables: ReturnType<typeof validatePublicVariables>;
	schema: EnvSchema;
	fs: typeof fsMod;
}) {
	let module = fs.readFileSync(MODULE_TEMPLATE_URL, 'utf-8');
	let publicTypes = '';
	let secretTypes = '';

	for (const { key, type, value } of validatedVariables.filter((e) => e.context === 'server')) {
		module += `export const ${key} = ${JSON.stringify(value)};`;
		publicTypes += `export const ${key}: ${type};	\n`;
	}

	for (const [key, options] of Object.entries(schema)) {
		if (!(options.context === 'server' && options.access === 'secret')) {
			continue;
		}

		secretTypes += `${key}: ${getEnvFieldType(options)};		\n`;
	}

	return {
		module,
		types: {
			public: publicTypes,
			secret: secretTypes,
		},
	};
}
