import { loadEnv, type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import {
	ENV_TYPES_FILE,
	RESOLVED_VIRTUAL_CLIENT_MODULE_ID,
	VIRTUAL_CLIENT_MODULE_ID,
} from './constants.js';
import type { EnvSchema } from './schema.js';
import { validateEnvVariable } from './validators.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';

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
	const loadedEnv = loadEnv(
		mode === 'dev' ? 'development' : 'production',
		fileURLToPath(settings.config.root),
		''
	);

	const validatedVariables = validatePublicVariables({ schema, loadedEnv });

	const clientTemplates = getClientTemplates({ validatedVariables });
	generateDts({ settings, fs, content: clientTemplates.dts });

	// TODO: server / public
	// TODO: server / secret
	return {
		name: 'astro-env-virtual-mod-plugin',
		enforce: 'pre',
		resolveId(id) {
			if (id === VIRTUAL_CLIENT_MODULE_ID) {
				return RESOLVED_VIRTUAL_CLIENT_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_CLIENT_MODULE_ID) {
				return clientTemplates.content;
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

function getClientTemplates({
	validatedVariables,
}: {
	validatedVariables: ReturnType<typeof validatePublicVariables>;
}) {
	const contentParts: Array<string> = [];
	const dtsParts: Array<string> = [];

	for (const { key, type, value } of validatedVariables.filter((e) => e.context === 'client')) {
		contentParts.push(`export const ${key} = ${JSON.stringify(value)};`);
		dtsParts.push(`export const ${key}: ${type};`);
	}

	const content = contentParts.join('\n');

	const dts = `declare module "astro:env/client" {
    ${dtsParts.join('\n    ')}
}`;

	return {
		content,
		dts,
	};
}
