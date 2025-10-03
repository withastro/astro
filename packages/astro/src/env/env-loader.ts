import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import type { AstroConfig } from '../types/public/index.js';

// Match valid JS variable names (identifiers), which accepts most alphanumeric characters,
// except that the first character cannot be a number.
const isValidIdentifierRe = /^[_$a-zA-Z][\w$]*$/;

/**
 * From public env, returns private env. Each value may be stringified, transformed as `process.env`
 * or coerced depending on options.
 */
function getPrivateEnv({
	fullEnv,
	viteConfig,
}: {
	fullEnv: Record<string, string>;
	viteConfig: AstroConfig['vite'];
}): Record<string, string> {
	let envPrefixes: string[] = ['PUBLIC_'];
	if (viteConfig.envPrefix) {
		envPrefixes = Array.isArray(viteConfig.envPrefix)
			? viteConfig.envPrefix
			: [viteConfig.envPrefix];
	}

	const privateEnv: Record<string, string> = {};
	for (const key in fullEnv) {
		// Ignore public env var
		if (!isValidIdentifierRe.test(key) || envPrefixes.some((prefix) => key.startsWith(prefix))) {
			continue;
		}
		privateEnv[key] = JSON.stringify(fullEnv[key]);
	}
	return privateEnv;
}

interface EnvLoaderOptions {
	mode: string;
	config: AstroConfig;
}

function getEnv({ mode, config }: EnvLoaderOptions) {
	const loaded = loadEnv(mode, config.vite.envDir ?? fileURLToPath(config.root), '');
	const privateEnv = getPrivateEnv({ fullEnv: loaded, viteConfig: config.vite });

	return { loaded, privateEnv };
}

export const createEnvLoader = (options: EnvLoaderOptions) => {
	let { loaded, privateEnv } = getEnv(options);
	return {
		get: () => {
			// We refresh the env we have in case process.env has been updated since creating
			// the env loader. That can happen in eg. integrations
			({ loaded, privateEnv } = getEnv(options));
			return loaded;
		},
		getPrivateEnv: () => privateEnv,
	};
};

export type EnvLoader = ReturnType<typeof createEnvLoader>;
