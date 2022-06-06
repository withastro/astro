import MagicString from 'magic-string';
import { fileURLToPath } from 'url';
import type * as vite from 'vite';
import { loadEnv } from 'vite';
import type { AstroConfig } from '../@types/astro';

interface EnvPluginOptions {
	config: AstroConfig;
}

function getPrivateEnv(viteConfig: vite.ResolvedConfig, astroConfig: AstroConfig) {
	let envPrefixes: string[] = ['PUBLIC_'];
	if (viteConfig.envPrefix) {
		envPrefixes = Array.isArray(viteConfig.envPrefix)
			? viteConfig.envPrefix
			: [viteConfig.envPrefix];
	}
	const fullEnv = loadEnv(
		viteConfig.mode,
		viteConfig.envDir ?? fileURLToPath(astroConfig.root),
		''
	);
	const privateKeys = Object.keys(fullEnv).filter((key) => {
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
	return Object.fromEntries(
		privateKeys.map((key) => {
			if (typeof process.env[key] !== 'undefined') return [key, `process.env.${key}`];
			return [key, JSON.stringify(fullEnv[key])];
		})
	);
}

function getReferencedPrivateKeys(source: string, privateEnv: Record<string, any>): Set<string> {
	const references = new Set<string>();
	for (const key of Object.keys(privateEnv)) {
		if (source.includes(key)) {
			references.add(key);
		}
	}
	return references;
}

export default function envVitePlugin({
	config: astroConfig,
}: EnvPluginOptions): vite.PluginOption {
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

			if (!ssr) {
				return source;
			}

			if (!source.includes('import.meta') || !/\benv\b/.test(source)) {
				return source;
			}

			if (typeof privateEnv === 'undefined') {
				privateEnv = getPrivateEnv(config, astroConfig);
				if (privateEnv) {
					privateEnv.SITE = astroConfig.site ? `'${astroConfig.site}'` : 'undefined';
					const entries = Object.entries(privateEnv).map(([key, value]) => [
						`import.meta.env.${key}`,
						value,
					]);
					replacements = Object.fromEntries(entries);
					// These additional replacements are needed to match Vite
					replacements = Object.assign(replacements, {
						'import.meta.env.SITE': astroConfig.site ? `'${astroConfig.site}'` : 'undefined',
						// This catches destructed `import.meta.env` calls,
						// BUT we only want to inject private keys referenced in the file.
						// We overwrite this value on a per-file basis.
						'import.meta.env': `({})`,
					});
					pattern = new RegExp(
						// Do not allow preceding '.', but do allow preceding '...' for spread operations
						'(?<!(?<!\\.\\.)\\.)\\b(' +
							Object.keys(replacements)
								.map((str) => {
									return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
								})
								.join('|') +
							// prevent trailing assignments
							')\\b(?!\\s*?=[^=])',
						'g'
					);
				}
			}

			if (!privateEnv || !pattern) return source;
			const references = getReferencedPrivateKeys(source, privateEnv);
			if (references.size === 0) return source;

			// Find matches for *private* env and do our own replacement.
			const s = new MagicString(source);
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(source))) {
				const start = match.index;
				const end = start + match[0].length;
				let replacement = '' + replacements[match[1]];
				// If we match exactly `import.meta.env`, define _only_ referenced private variables
				if (match[0] === 'import.meta.env') {
					replacement = `(Object.assign(import.meta.env,{`;
					for (const key of references.values()) {
						replacement += `${key}:${privateEnv[key]},`;
					}
					replacement += '}))';
				}
				s.overwrite(start, end, replacement);
			}

			return s.toString();
		},
	};
}
