import type * as vite from 'vite';
import type { AstroConfig } from '../@types/astro';
import MagicString from 'magic-string';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

interface EnvPluginOptions {
	config: AstroConfig;
}

export default function envVitePlugin({ config: astroConfig }: EnvPluginOptions): vite.PluginOption {
	let privateEnv: Record<string, any> | undefined;
	let privateKeys: string[] = [];
	let config: vite.ResolvedConfig;
	let envPrefixes: string[] = ['PUBLIC_'];
	return {
		name: 'astro:vite-plugin-env',
		enforce: 'pre',

		configResolved(resolvedConfig) {
			config = resolvedConfig;
			if (config.envPrefix) {
				envPrefixes = Array.isArray(config.envPrefix) ? config.envPrefix : [config.envPrefix];
			}
		},

		async transform(source, id, options) {
			const ssr = options?.ssr === true;
			if (!ssr) return source;
			// Naive!
			if (!source.includes('import.meta.env')) return source;

			if (!privateEnv) {
				privateEnv = {};
				const fullEnv = loadEnv(config.mode, config.envDir ?? fileURLToPath(astroConfig.projectRoot), '');
				outer: for (const key of Object.keys(fullEnv)) {
					// don't expose any variables also on `process.env`
					// note: this filters out `CLI_ARGS=1` passed to node!
					if (typeof process.env[key] !== 'undefined') {
						continue;
					}
					// don't inject `PUBLIC_` variables, Vite handles that
					for (const envPrefix of envPrefixes) {
						if (key.startsWith(envPrefix)) {
							continue outer;
						}
					}
					privateEnv[key] = fullEnv[key];
					privateKeys.push(key);
				}
			}

			if (privateKeys.length === 0) return source;

			let privateKeyAccess = false;
			for (const key of privateKeys) {
				if (source.includes(key)) {
					privateKeyAccess = true;
					break;
				}
			}
			if (!privateKeyAccess) return source;

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
