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

	const { clientContent, clientDts } = handleClientModule({ schema, loadedEnv });
	generateDts({ settings, fs, content: clientDts });

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
				return clientContent;
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

function handleClientModule({
	schema,
	loadedEnv,
}: {
	schema: EnvSchema;
	loadedEnv: Record<string, string>;
}) {
	const data: Array<{ key: string; value: any; type: string }> = [];

	for (const [key, options] of Object.entries(schema)) {
		if (options.context !== 'client') {
			continue;
		}
		const variable = loadedEnv[key];
		const result = validateEnvVariable(variable === '' ? undefined : variable, options);
		if (!result.ok) {
			throw new AstroError({
				...AstroErrorData.EnvInvalidVariable,
				message: AstroErrorData.EnvInvalidVariable.message(key, result.type),
			});
		}
		data.push({ key, value: result.value, type: result.type });
	}

	const contentParts: Array<string> = [];
	const dtsParts: Array<string> = [];

	for (const { key, type, value } of data) {
		contentParts.push(`export const ${key} = ${JSON.stringify(value)};`);
		dtsParts.push(`export const ${key}: ${type};`);
	}

	const clientContent = contentParts.join('\n');

	const clientDts = `declare module "astro:env/client" {
    ${dtsParts.join('\n    ')}
}`;

	return {
		clientContent,
		clientDts,
	};
}
