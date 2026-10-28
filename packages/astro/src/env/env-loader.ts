import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import type { AstroConfig } from '../types/public/index.js';
import type { EnvSchema } from './schema.js';

// Match valid JS variable names (identifiers), which accepts most alphanumeric characters,
// except that the first character cannot be a number.
const isValidIdentifierRe = /^[_$a-zA-Z][\w$]*$/;

/**
 * Collects the set of env variable names declared with `access: "secret"` in the env schema.
 */
function getSecretKeys(envSchema: EnvSchema): Set<string> {
	const secrets = new Set<string>();
	for (const [key, options] of Object.entries(envSchema)) {
		if (options.access === 'secret') {
			secrets.add(key);
		}
	}
	return secrets;
}

/**
 * From public env, returns private env. Each value may be stringified, transformed as `process.env`
 * or coerced depending on options.
 *
 * Variables declared with `access: "secret"` in the env schema are always treated as private,
 * even if their name matches a configured `envPrefix`. This prevents envPrefix misconfiguration
 * from leaking secrets to client bundles.
 */
function getPrivateEnv({
	fullEnv,
	viteConfig,
	envSchema,
}: {
	fullEnv: Record<string, string>;
	viteConfig: AstroConfig['vite'];
	envSchema: EnvSchema;
}): Record<string, string> {
	let envPrefixes: string[] = ['PUBLIC_'];
	if (viteConfig.envPrefix) {
		envPrefixes = Array.isArray(viteConfig.envPrefix)
			? viteConfig.envPrefix
			: [viteConfig.envPrefix];
	}

	const secretKeys = getSecretKeys(envSchema);
	const privateEnv: Record<string, string> = {};
	for (const key in fullEnv) {
		if (!isValidIdentifierRe.test(key)) {
			continue;
		}

		// Variables declared as secret in the env schema are always private,
		// regardless of whether they match an envPrefix.
		if (secretKeys.has(key)) {
			privateEnv[key] = JSON.stringify(fullEnv[key]);
			continue;
		}

		// Skip variables matching envPrefix — these are public (handled by Vite)
		if (envPrefixes.some((prefix) => key.startsWith(prefix))) {
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
	const privateEnv = getPrivateEnv({
		fullEnv: loaded,
		viteConfig: config.vite,
		envSchema: config.env.schema,
	});

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
