import MagicString from 'magic-string';
import { fileURLToPath } from 'url';
import type * as vite from 'vite';
import { loadEnv } from 'vite';
import type { AstroConfig, AstroSettings } from '../@types/astro';

interface EnvPluginOptions {
	settings: AstroSettings;
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
			return [key, JSON.stringify(process.env[key] ?? fullEnv[key])];
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

export default function envVitePlugin({ settings }: EnvPluginOptions): vite.PluginOption {
	let privateEnv: Record<string, any>;
	let config: vite.ResolvedConfig;
	let pattern: RegExp | undefined;
	const { config: astroConfig } = settings;
	return {
		name: 'astro:vite-plugin-env',
		enforce: 'pre',
		configResolved(resolvedConfig) {
			config = resolvedConfig;
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
				privateEnv = getPrivateEnv(config, astroConfig) || {};
				privateEnv.SITE = astroConfig.site ? `'${astroConfig.site}'` : 'undefined';
				privateEnv.SSR = JSON.stringify(true);
				privateEnv.BASE_URL = astroConfig.base ? `'${astroConfig.base}'` : undefined;
			}

			pattern ??= new RegExp(
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

			// Find matches for *private* env and do our own replacement.
			const s = new MagicString(source);
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(source))) {
				const start = match.index;
				const end = start + match[0].length;
				let replacement: string;
				// If we match exactly `import.meta.env`, define _only_ referenced private variables
				if (match[0] === 'import.meta.env') {
					references ??= getReferencedPrivateKeys(source, privateEnv);
					replacement = `(Object.assign(import.meta.env,{`;
					for (const key of references.values()) {
						replacement += `${key}:${privateEnv[key]},`;
					}
					replacement += '}))';
				} else {
					replacement = privateEnv[match[2]] ?? astroConfig.build.envKey(match[2]);
				}
				s.overwrite(start, end, replacement);
			}

			return {
				code: s.toString(),
				map: s.generateMap(),
			};
		},
	};
}
