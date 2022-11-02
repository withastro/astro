import MagicString from 'magic-string';
import { fileURLToPath } from 'url';
import type * as vite from 'vite';
import { loadEnv } from 'vite';
import type { AstroConfig, AstroSettings } from '../@types/astro';

interface EnvPluginOptions {
	settings: AstroSettings;
}

function getPrivateEnv(
	viteConfig: vite.ResolvedConfig,
	astroConfig: AstroConfig,
	isPublicEnv: (str: string) => boolean
) {
	const fullEnv = loadEnv(
		viteConfig.mode,
		viteConfig.envDir ?? fileURLToPath(astroConfig.root),
		''
	);
	const privateEnv: Record<string, string> = {};
	for (const key in fullEnv) {
		if (!isPublicEnv(key)) {
			privateEnv[key] = JSON.stringify(process.env[key] ?? fullEnv[key]);
		}
	}
	privateEnv.SITE = astroConfig.site ? `'${astroConfig.site}'` : 'undefined';
	privateEnv.SSR = JSON.stringify(true);
	privateEnv.BASE_URL = astroConfig.base ? `'${astroConfig.base}'` : 'undefined';
	return privateEnv;
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

export default function envVitePlugin({ settings }: EnvPluginOptions): vite.PluginOption {
	let privateEnv: Record<string, any>;
	let config: vite.ResolvedConfig;
	let isPublicEnv: (str: string) => boolean;
	const { config: astroConfig } = settings;
	return {
		name: 'astro:vite-plugin-env',
		enforce: 'pre',
		configResolved(resolvedConfig) {
			config = resolvedConfig;
			let envPrefixes: string[] = ['PUBLIC_'];
			if (resolvedConfig.envPrefix) {
				envPrefixes = Array.isArray(resolvedConfig.envPrefix)
					? resolvedConfig.envPrefix
					: [resolvedConfig.envPrefix];
			}
			isPublicEnv = (str: string) => envPrefixes.some((prefix) => str.startsWith(prefix));
		},
		async transform(source, id, options) {
			const ssr = options?.ssr === true;

			if (!ssr) {
				return;
			}

			if (!source.includes('import.meta') || !/\benv\b/.test(source)) {
				return;
			}

			if (typeof privateEnv === 'undefined') {
				privateEnv = getPrivateEnv(config, astroConfig, isPublicEnv);
			}

			// Find matches for *private* env and do our own replacement.
			const s = new MagicString(source);
			const pattern = new RegExp(
				// Do not allow preceding '.', but do allow preceding '...' for spread operations
				'(?<!(?<!\\.\\.)\\.)\\b(' +
					// Captures `import.meta.env.*` calls and replace with `privateEnv` or `build.envKey`
					`import\\.meta\\.env\\.(.+)` +
					'|' +
					// This catches destructed `import.meta.env` calls,
					// BUT we only want to inject private keys referenced in the file.
					// We overwrite this value on a per-file basis.
					'import\\.meta\\.env' +
					// prevent trailing assignments
					')\\b(?!\\s*?=[^=])',
				'g'
			);
			let references: Set<string>;
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(source))) {
				let replacement: string | undefined;
				// If we match exactly `import.meta.env`, define _only_ referenced private variables
				if (match[0] === 'import.meta.env') {
					privateEnv ??= getPrivateEnv(config, astroConfig, isPublicEnv);
					references ??= getReferencedPrivateKeys(source, privateEnv);
					replacement = `(Object.assign(import.meta.env,{`;
					for (const key of references.values()) {
						replacement += `${key}:${privateEnv[key]},`;
					}
					replacement += '}))';
				}
				// If we match `import.meta.emv.*`, make sure this isn't referecing a public env.
				// For private env, we replace with the value from the `.env` file, or otherwise
				// convert to runtime resolve with `envKey`, e.g. `process.env.*`.
				else if (match[2] && !isPublicEnv(match[2])) {
					privateEnv ??= getPrivateEnv(config, astroConfig, isPublicEnv);
					replacement = privateEnv[match[2]] ?? astroConfig.build.envKey(match[2]);
				}
				if (replacement) {
					const start = match.index;
					const end = start + match[0].length;
					s.overwrite(start, end, replacement);
				}
			}

			return {
				code: s.toString(),
				map: s.generateMap(),
			};
		},
	};
}
