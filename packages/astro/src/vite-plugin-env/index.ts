import type * as vite from 'vite';
import type { AstroConfig } from '../@types/astro';
import MagicString from 'magic-string';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

interface EnvPluginOptions {
	config: AstroConfig;
}

function getPrivateEnv(viteConfig: vite.ResolvedConfig, astroConfig: AstroConfig) {
	let envPrefixes: string[] = ['PUBLIC_'];
	if (viteConfig.envPrefix) {
		envPrefixes = Array.isArray(viteConfig.envPrefix) ? viteConfig.envPrefix : [viteConfig.envPrefix];
	}
	const fullEnv = loadEnv(viteConfig.mode, viteConfig.envDir ?? fileURLToPath(astroConfig.projectRoot), '');
	const privateKeys = Object.keys(fullEnv).filter((key) => {
		// don't expose any variables also on `process.env`
		// note: this filters out `CLI_ARGS=1` passed to node!
		if (typeof process.env[key] !== 'undefined') return false;

		// don't inject `PUBLIC_` variables, Vite handles that for us
		for (const envPrefix of envPrefixes) {
			if (key.startsWith(envPrefix)) return false;
		}

		// Otherwise, this is a private variable defined in an `.env` file
		return true;
	});
	if (privateKeys.length === 0) {
		return null;
	}
	return Object.fromEntries(privateKeys.map((key) => [key, fullEnv[key]]));
}

function referencesPrivateKey(source: string, privateEnv: Record<string, any>) {
	for (const key of Object.keys(privateEnv)) {
		if (source.includes(key)) return true;
	}
	return false;
}

export default function envVitePlugin({ config: astroConfig }: EnvPluginOptions): vite.PluginOption {
	let privateEnv: Record<string, any> | null;
	let config: vite.ResolvedConfig;
	return {
		name: 'astro:vite-plugin-env',
		enforce: 'pre',

		configResolved(resolvedConfig) {
			config = resolvedConfig;
			if (config.envPrefix) {
			}
		},

		async transform(source, id, options) {
			const ssr = options?.ssr === true;
			if (!ssr) return source;
			if (!source.includes('import.meta')) return source;
			if (!/\benv\b/.test(source)) return source;

			if (typeof privateEnv === 'undefined') {
				privateEnv = getPrivateEnv(config, astroConfig);
			}
			if (!privateEnv) return source;
			if (!referencesPrivateKey(source, privateEnv)) return source;

			const s = new MagicString(source);
			// prettier-ignore
			s.prepend(`import.meta.env = new Proxy(import.meta.env, {` +
				`get(target, prop, reciever) {` +
					`const PRIVATE = ${JSON.stringify(privateEnv)};` +
					`if (typeof PRIVATE[prop] !== 'undefined') {` +
						`return PRIVATE[prop];` +
					`}` +
					`return Reflect.get(target, prop, reciever);` +
				`}` +
			`});\n`);

			return s.toString();
		},
	};
}
