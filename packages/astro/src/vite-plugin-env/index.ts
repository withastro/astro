import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import { bold } from 'kleur/colors';
import MagicString from 'magic-string';
import type * as vite from 'vite';
import { loadEnv } from 'vite';
import type { AstroConfig, AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

interface EnvPluginOptions {
	settings: AstroSettings;
	logger: Logger;
}

// Match `import.meta.env` directly without trailing property access
const importMetaEnvOnlyRe = /\bimport\.meta\.env\b(?!\.)/;
// Match valid JS variable names (identifiers), which accepts most alphanumeric characters,
// except that the first character cannot be a number.
const isValidIdentifierRe = /^[_$a-zA-Z][\w$]*$/;
// Match `export const prerender = import.meta.env.*` since `vite=plugin-scanner` requires
// the `import.meta.env.*` to always be replaced.
const exportConstPrerenderRe = /\bexport\s+const\s+prerender\s*=\s*import\.meta\.env\.(.+?)\b/;

function getPrivateEnv(
	viteConfig: vite.ResolvedConfig,
	astroConfig: AstroConfig,
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
		'',
	);

	const privateEnv: Record<string, string> = {};
	for (const key in fullEnv) {
		// Ignore public env var
		if (isValidIdentifierRe.test(key) && envPrefixes.every((prefix) => !key.startsWith(prefix))) {
			if (typeof process.env[key] !== 'undefined') {
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
	}
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

/**
 * Use esbuild to perform replacememts like Vite
 * https://github.com/vitejs/vite/blob/5ea9edbc9ceb991e85f893fe62d68ed028677451/packages/vite/src/node/plugins/define.ts#L130
 */
async function replaceDefine(
	code: string,
	id: string,
	define: Record<string, string>,
	config: vite.ResolvedConfig,
): Promise<{ code: string; map: string | null }> {
	// Since esbuild doesn't support replacing complex expressions, we replace `import.meta.env`
	// with a marker string first, then postprocess and apply the `Object.assign` code.
	const replacementMarkers: Record<string, string> = {};
	const env = define['import.meta.env'];
	if (env) {
		// Compute the marker from the length of the replaced code. We do this so that esbuild generates
		// the sourcemap with the right column offset when we do the postprocessing.
		const marker = `__astro_import_meta_env${'_'.repeat(
			env.length - 23 /* length of preceding string */,
		)}`;
		replacementMarkers[marker] = env;
		define = { ...define, 'import.meta.env': marker };
	}

	const esbuildOptions = config.esbuild || {};

	const result = await transform(code, {
		loader: 'js',
		charset: esbuildOptions.charset ?? 'utf8',
		platform: 'neutral',
		define,
		sourcefile: id,
		sourcemap: config.command === 'build' ? !!config.build.sourcemap : true,
	});

	for (const marker in replacementMarkers) {
		result.code = result.code.replaceAll(marker, replacementMarkers[marker]);
	}

	return {
		code: result.code,
		map: result.map || null,
	};
}

export default function envVitePlugin({ settings, logger }: EnvPluginOptions): vite.Plugin {
	let privateEnv: Record<string, string>;
	let defaultDefines: Record<string, string>;
	let isDev: boolean;
	let devImportMetaEnvPrepend: string;
	let viteConfig: vite.ResolvedConfig;
	const { config: astroConfig } = settings;
	return {
		name: 'astro:vite-plugin-env',
		config(_, { command }) {
			isDev = command !== 'build';
		},
		configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;

			// HACK: move ourselves before Vite's define plugin to apply replacements at the right time (before Vite normal plugins)
			const viteDefinePluginIndex = resolvedConfig.plugins.findIndex(
				(p) => p.name === 'vite:define',
			);
			if (viteDefinePluginIndex !== -1) {
				const myPluginIndex = resolvedConfig.plugins.findIndex(
					(p) => p.name === 'astro:vite-plugin-env',
				);
				if (myPluginIndex !== -1) {
					const myPlugin = resolvedConfig.plugins[myPluginIndex];
					// @ts-ignore-error ignore readonly annotation
					resolvedConfig.plugins.splice(viteDefinePluginIndex, 0, myPlugin);
					// @ts-ignore-error ignore readonly annotation
					resolvedConfig.plugins.splice(myPluginIndex, 1);
				}
			}
		},
		transform(source, id, options) {
			if (!options?.ssr || !source.includes('import.meta.env')) {
				return;
			}

			// Find matches for *private* env and do our own replacement.
			privateEnv ??= getPrivateEnv(viteConfig, astroConfig);

			// In dev, we can assign the private env vars to `import.meta.env` directly for performance
			if (isDev) {
				const s = new MagicString(source);

				if (!devImportMetaEnvPrepend) {
					devImportMetaEnvPrepend = `Object.assign(import.meta.env,{`;
					for (const key in privateEnv) {
						devImportMetaEnvPrepend += `${key}:${privateEnv[key]},`;
					}
					devImportMetaEnvPrepend += '});';
				}
				s.prepend(devImportMetaEnvPrepend);

				// EDGE CASE: We need to do a static replacement for `export const prerender` for `vite-plugin-scanner`
				// TODO: Remove in Astro 5
				let exportConstPrerenderStr: string | undefined;
				s.replace(exportConstPrerenderRe, (m, key) => {
					if (privateEnv[key] != null) {
						exportConstPrerenderStr = m;
						return `export const prerender = ${privateEnv[key]}`;
					} else {
						return m;
					}
				});
				if (exportConstPrerenderStr) {
					logger.warn(
						'router',
						`Exporting dynamic values from prerender is deprecated. Please use an integration with the "astro:route:setup" hook ` +
							`to update the route's \`prerender\` option instead. This allows for better treeshaking and bundling configuration ` +
							`in the future. See https://docs.astro.build/en/reference/integrations-reference/#astroroutesetup for a migration example.` +
							`\nFound \`${bold(exportConstPrerenderStr)}\` in ${bold(id)}.`,
					);
				}

				return {
					code: s.toString(),
					map: s.generateMap({ hires: 'boundary' }),
				};
			}

			// In build, use esbuild to perform replacements. Compute the default defines for esbuild here as a
			// separate object as it could be extended by `import.meta.env` later.
			if (!defaultDefines) {
				defaultDefines = {};
				for (const key in privateEnv) {
					defaultDefines[`import.meta.env.${key}`] = privateEnv[key];
				}
			}

			let defines = defaultDefines;

			// If reference the `import.meta.env` object directly, we want to inject private env vars
			// into Vite's injected `import.meta.env` object. To do this, we use `Object.assign` and keeping
			// the `import.meta.env` identifier so Vite sees it.
			if (importMetaEnvOnlyRe.test(source)) {
				const references = getReferencedPrivateKeys(source, privateEnv);
				let replacement = `(Object.assign(import.meta.env,{`;
				for (const key of references.values()) {
					replacement += `${key}:${privateEnv[key]},`;
				}
				replacement += '}))';
				defines = {
					...defaultDefines,
					'import.meta.env': replacement,
				};
			}

			return replaceDefine(source, id, defines, viteConfig);
		},
	};
}
