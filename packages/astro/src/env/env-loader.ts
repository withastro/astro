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
	useStatic,
}: {
	fullEnv: Record<string, string>;
	viteConfig: AstroConfig['vite'];
	useStatic: boolean;
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
		// Only replace with process.env if not static
		// TODO: make static the default and only way to do this in Astro 6
		if (!useStatic && typeof process.env[key] !== 'undefined') {
			let value = process.env[key];
			// Replacements are always strings, so try to convert to strings here first
			if (typeof value !== 'string') {
				value = `${value}`;
			}
			// Boolean values should be inlined to support `export const prerender`
			// We already know that these are NOT sensitive values, so inlining is safe
			if (value === '0' || value === '1' || value === 'true' || value === 'false') {
				privateEnv[key] = value;
			} else {
				privateEnv[key] = `process.env.${key}`;
			}
		} else {
			privateEnv[key] = JSON.stringify(fullEnv[key]);
		}
	}
	return privateEnv;
}

interface EnvLoaderOptions {
	mode: string;
	config: AstroConfig;
	useStatic: boolean;
}

function getEnv({ mode, config, useStatic }: EnvLoaderOptions) {
	const loaded = loadEnv(mode, config.vite.envDir ?? fileURLToPath(config.root), '');
	const privateEnv = getPrivateEnv({ fullEnv: loaded, viteConfig: config.vite, useStatic });

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
