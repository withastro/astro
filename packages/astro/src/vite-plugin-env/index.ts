import type * as vite from 'vite';
import type { AstroConfig } from '../@types/astro';
import type { TransformPluginContext } from 'rollup';
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
	return Object.fromEntries(privateKeys.map((key) => [key, JSON.stringify(fullEnv[key])]));
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
	let replacements: Record<string, string>;
	let pattern: RegExp | undefined;
	return {
		name: 'astro:vite-plugin-env',
		enforce: 'pre',
		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},
		async transform(source, id, options) {
			const ssr = options?.ssr === true;

			if(!ssr) {
				return source;
			}

			if(!source.includes('import.meta') || !/\benv\b/.test(source)) {
				return source;
			}

			if (typeof privateEnv === 'undefined') {
				privateEnv = getPrivateEnv(config, astroConfig);
				if(privateEnv) {
					const entries = Object.entries(privateEnv).map(([key, value]) => ([`import.meta.env.${key}`, value]));
					replacements = Object.fromEntries(entries);
					pattern = new RegExp(
						// Do not allow preceding '.', but do allow preceding '...' for spread operations
						'(?<!(?<!\\.\\.)\\.)\\b(' +
								Object.keys(replacements)
										.map((str) => {
										return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
								})
										.join('|') +
								// prevent trailing assignments
								')\\b(?!\\s*?=[^=])', 'g');
				}
			}

			if (!privateEnv || !pattern) return source;
			if (!referencesPrivateKey(source, privateEnv)) return source;

			// Find matches for *private* env and do our own replacement.
			const s = new MagicString(source);
			let match: RegExpExecArray | null

			while ((match = pattern.exec(source))) {
				const start = match.index
				const end = start + match[0].length
				const replacement = '' + replacements[match[1]]
				s.overwrite(start, end, replacement)
			}

			return s.toString();
		},
	};
}
