import { transform } from 'esbuild';
import MagicString from 'magic-string';
import { CSS_LANGS_RE } from '../core/viteUtils.js';
import { isAstroClientEnvironment } from '../environments.js';
const importMetaEnvOnlyRe = /\bimport\.meta\.env\b(?!\.)/;
function getReferencedPrivateKeys(source, privateEnv) {
	const references = /* @__PURE__ */ new Set();
	for (const key in privateEnv) {
		if (source.includes(key)) {
			references.add(key);
		}
	}
	return references;
}
async function replaceDefine(code, id, define, config) {
	const replacementMarkers = {};
	const env = define['import.meta.env'];
	if (env) {
		const marker = `__astro_import_meta_env${'_'.repeat(env.length - 23)}`;
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
function importMetaEnv({ envLoader }) {
	let privateEnv;
	let defaultDefines;
	let isDev;
	let devImportMetaEnvPrepend;
	let viteConfig;
	return {
		name: 'astro:vite-plugin-env',
		config(_, { command }) {
			isDev = command !== 'build';
		},
		configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;
			const viteDefinePluginIndex = resolvedConfig.plugins.findIndex(
				(p) => p.name === 'vite:define',
			);
			if (viteDefinePluginIndex !== -1) {
				const myPluginIndex = resolvedConfig.plugins.findIndex(
					(p) => p.name === 'astro:vite-plugin-env',
				);
				if (myPluginIndex !== -1) {
					const myPlugin = resolvedConfig.plugins[myPluginIndex];
					resolvedConfig.plugins.splice(viteDefinePluginIndex, 0, myPlugin);
					resolvedConfig.plugins.splice(myPluginIndex, 1);
				}
			}
		},
		transform: {
			filter: {
				id: {
					exclude: [/.*\.(html|htm|json)$/, CSS_LANGS_RE],
				},
				code: /import\.meta\.env/,
			},
			handler(source, id) {
				if (isAstroClientEnvironment(this.environment) || viteConfig.assetsInclude(id)) {
					return;
				}
				privateEnv ??= envLoader.getPrivateEnv();
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
					return {
						code: s.toString(),
						map: s.generateMap({ hires: 'boundary' }),
					};
				}
				if (!defaultDefines) {
					defaultDefines = {};
					for (const key in privateEnv) {
						defaultDefines[`import.meta.env.${key}`] = privateEnv[key];
					}
				}
				let defines = defaultDefines;
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
		},
	};
}
export { importMetaEnv };
