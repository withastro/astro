import { loadEnv, type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import {
	ENV_TYPES_FILE,
	MODULE_TEMPLATE_URL,
	RESOLVED_VIRTUAL_CLIENT_MODULE_ID,
	RESOLVED_VIRTUAL_INTERNAL_MODULE_ID,
	RESOLVED_VIRTUAL_SERVER_MODULE_ID,
	TYPES_TEMPLATE_URL,
	VIRTUAL_CLIENT_MODULE_ID,
	VIRTUAL_INTERNAL_MODULE_ID,
	VIRTUAL_SERVER_MODULE_ID,
} from './constants.js';
import type { EnvSchema } from './schema.js';
import { getType, validateEnvVariable } from './validators.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';

// TODO:

interface AstroEnvVirtualModPluginParams {
	settings: AstroSettings;
	logger: Logger;
	mode: 'dev' | 'build' | string;
	fs: typeof fsMod;
}

export function astroEnvVirtualModPlugin({
	settings,
	logger,
	mode,
	fs,
}: AstroEnvVirtualModPluginParams): Plugin | undefined {
	if (!settings.config.experimental.env) {
		return;
	}
	logger.warn('env', 'This feature is experimental. TODO:');
	const schema = settings.config.experimental.env.schema ?? {};

	let templates: { client: string; server: string; internal: string } | null = null;

	return {
		name: 'astro-env-virtual-mod-plugin',
		enforce: 'pre',
		buildStart() {
			const loadedEnv = loadEnv(
				mode === 'dev' ? 'development' : 'production',
				fileURLToPath(settings.config.root),
				''
			);
			const validatedVariables = validatePublicVariables({ schema, loadedEnv });

			const clientTemplates = getTemplates({ validatedVariables, context: 'client' });
			const serverTemplates = getTemplates({
				validatedVariables,
				context: 'server',
				...getSecretServerTemplates({ schema, fs }),
			});

			templates = {
				client: clientTemplates.content,
				server: serverTemplates.content,
				internal: `export const schema = ${JSON.stringify(schema)};`,
			};
			generateDts({ settings, fs, content: `${clientTemplates.dts}\n\n${serverTemplates.dts}` });
		},
		buildEnd() {
			templates = null;
		},
		resolveId(id) {
			if (id === VIRTUAL_CLIENT_MODULE_ID) {
				return RESOLVED_VIRTUAL_CLIENT_MODULE_ID;
			}
			if (id === VIRTUAL_SERVER_MODULE_ID) {
				return RESOLVED_VIRTUAL_SERVER_MODULE_ID;
			}
			if (id === VIRTUAL_INTERNAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_INTERNAL_MODULE_ID;
			}
		},
		load(id, options) {
			if (id === RESOLVED_VIRTUAL_CLIENT_MODULE_ID) {
				return templates!.client;
			}
			if (id === RESOLVED_VIRTUAL_SERVER_MODULE_ID) {
				if (options?.ssr) {
					return templates!.server;
				}
				throw new AstroError({
					...AstroErrorData.EnvServerOnlyModule,
					message: AstroErrorData.EnvServerOnlyModule.message(VIRTUAL_SERVER_MODULE_ID),
				});
			}
			if (id === RESOLVED_VIRTUAL_INTERNAL_MODULE_ID) {
				return templates!.internal;
			}
		},
	};
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
				invalid.map(({ key, type }) => `Variable "${key}" is not of type: ${type}.`).join('\n')
			),
		});
	}

	return valid;
}

function getTemplates({
	validatedVariables,
	context,
	additionalContent = [],
	additionalDts = [],
}: {
	validatedVariables: ReturnType<typeof validatePublicVariables>;
	context: 'server' | 'client';
	additionalContent?: Array<string>;
	additionalDts?: Array<string>;
}) {
	const contentParts = additionalContent;
	const dtsParts = additionalDts;

	for (const { key, type, value } of validatedVariables.filter((e) => e.context === context)) {
		contentParts.push(`export const ${key} = ${JSON.stringify(value)};`);
		dtsParts.push(`export const ${key}: ${type};`);
	}

	const content = contentParts.join('\n');

	const dts = `declare module "astro:env/${context}" {
    ${dtsParts.join('\n    ')}
}`;

	return {
		content,
		dts,
	};
}

function getSecretServerTemplates({ schema, fs }: { schema: EnvSchema; fs: typeof fsMod }) {
	const parts: Array<string> = [];

	for (const [key, options] of Object.entries(schema)) {
		if (!(options.context === 'server' && options.access === 'secret')) {
			continue;
		}

		parts.push(`"${key}": ${getType(options)};`);
	}

	return {
		additionalContent: [fs.readFileSync(MODULE_TEMPLATE_URL, 'utf-8')],
		additionalDts: [
			fs
				.readFileSync(TYPES_TEMPLATE_URL, 'utf-8')
				.replace("'@@SECRET_VALUES@@'", `{\n		${parts.join('\n		')}\n	}`) + "\n",
		],
	};
}
