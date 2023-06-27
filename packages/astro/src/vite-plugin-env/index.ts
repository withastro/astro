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
	astroConfig: AstroConfig
): Record<string, string> {
	let envPrefixes: string[] = ['PUBLIC_'];
	if (viteConfig.envPrefix) {
		envPrefixes = Array.isArray(viteConfig.envPrefix)
			? viteConfig.envPrefix
			: [viteConfig.envPrefix];
	}

	// Loads environment variables from `.env` files and `process.env`
	const fullEnv = loadEnv(
		viteConfig.mode,
		viteConfig.envDir ?? fileURLToPath(astroConfig.root),
		''
	);

	const privateEnv: Record<string, string> = {};
	for (const key in fullEnv) {
		// Ignore public env var
		if (envPrefixes.every((prefix) => !key.startsWith(prefix))) {
			if (typeof process.env[key] !== 'undefined') {
				const value = process.env[key];
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
	}
	privateEnv.SITE = astroConfig.site ? JSON.stringify(astroConfig.site) : 'undefined';
	privateEnv.SSR = JSON.stringify(true);
	privateEnv.BASE_URL = astroConfig.base ? JSON.stringify(astroConfig.base) : 'undefined';
	privateEnv.ASSETS_PREFIX = astroConfig.build.assetsPrefix
		? JSON.stringify(astroConfig.build.assetsPrefix)
		: 'undefined';
	return privateEnv;
}

function getReferencedPrivateKeys(source: string, privateEnv: Record<string, any>): Set<string> {
	const references = new Set<string>();
	for (const key in privateEnv) {
		if (source.includes(key)) {
			references.add(key);
		}
	}
	return references;
}

export default function envVitePlugin({ settings }: EnvPluginOptions): vite.PluginOption {
	let privateEnv: Record<string, string>;
	let viteConfig: vite.ResolvedConfig;
	const { config: astroConfig } = settings;
	return {
		name: 'astro:vite-plugin-env',
		enforce: 'pre',
		config() {
			return {
				define: {
					'import.meta.env.BASE_URL': astroConfig.base
						? JSON.stringify(astroConfig.base)
						: 'undefined',
					'import.meta.env.ASSETS_PREFIX': astroConfig.build.assetsPrefix
						? JSON.stringify(astroConfig.build.assetsPrefix)
						: 'undefined',
				},
			};
		},
		configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;
		},
		async transform(source, id, options) {
			if (!options?.ssr || !source.includes('import.meta.env')) {
				return;
			}

			// Find matches for *private* env and do our own replacement.
			let s: MagicString | undefined;
			const pattern = new RegExp(
				// Do not allow preceding '.', but do allow preceding '...' for spread operations
				'(?<!(?<!\\.\\.)\\.)\\b(' +
					// Captures `import.meta.env.*` calls and replace with `privateEnv`
					`import\\.meta\\.env\\.(.+?)` +
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
					privateEnv ??= getPrivateEnv(viteConfig, astroConfig);
					references ??= getReferencedPrivateKeys(source, privateEnv);
					replacement = `(Object.assign(import.meta.env,{`;
					for (const key of references.values()) {
						replacement += `${key}:${privateEnv[key]},`;
					}
					replacement += '}))';
				}
				// If we match `import.meta.env.*`, replace with private env
				else if (match[2]) {
					privateEnv ??= getPrivateEnv(viteConfig, astroConfig);
					replacement = privateEnv[match[2]];
				}
				if (replacement) {
					const start = match.index;
					const end = start + match[0].length;
					s ??= new MagicString(source);
					s.overwrite(start, end, replacement);
				}
			}

			if (s) {
				return {
					code: s.toString(),
					map: s.generateMap({ hires: true }),
				};
			}
		},
	};
}
