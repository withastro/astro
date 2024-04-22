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
	// TODO: should that be config.root instead?
	const loadedEnv = loadEnv(mode === 'dev' ? 'development' : 'production', process.cwd(), '');

	const { clientContent } = handleClientModule({ schema, loadedEnv, settings, fs });

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
		load(id, options) {
			if (id === RESOLVED_VIRTUAL_CLIENT_MODULE_ID) {
				return clientContent;
			}
		},
	};
}

function handleClientModule({
	schema,
	loadedEnv,
	settings,
	fs,
}: {
	schema: EnvSchema;
	loadedEnv: Record<string, string>;
	settings: AstroSettings;
	fs: typeof fsMod;
}) {
	const data: Array<{ key: string; value: any; type: string }> = [];

	for (const [key, options] of Object.entries(schema)) {
		if (options.context !== 'client') {
			continue;
		}
		// TODO: check if an empty value is '' or undefined
		const result = validateEnvVariable(loadedEnv[key], options);
		if (!result.ok) {
			throw new AstroError({
				...AstroErrorData.EnvInvalidVariable,
				message: AstroErrorData.EnvInvalidVariable.message(key, result.type),
			});
		}
		data.push({ key, value: result.value, type: result.type });
	}

	const clientContent = `
const data = ${JSON.stringify(Object.fromEntries(data.map((e) => [e.key, e.value])))};

export const {
	${data.map((e) => e.key).join(', ')}
}
	`;

	// TODO: generate types
	// 1. create reference in src/env.d.ts
	// 2. create content
	// 3. create file
	// 4. extract to a utility shared with the content part
	fs.mkdirSync(settings.dotAstroDir, { recursive: true });
	fs.writeFileSync(new URL(ENV_TYPES_FILE, settings.dotAstroDir), '', 'utf-8');

	return {
		clientContent,
	};
}
