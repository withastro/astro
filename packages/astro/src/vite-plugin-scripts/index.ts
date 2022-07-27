import { ConfigEnv, Plugin as VitePlugin } from 'vite';
import { AstroConfig, InjectedScriptStage } from '../@types/astro.js';

// NOTE: We can't use the virtual "\0" ID convention because we need to
// inject these as ESM imports into actual code, where they would not
// resolve correctly.
const SCRIPT_ID_PREFIX = `astro:scripts/`;
export const BEFORE_HYDRATION_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${
	'before-hydration' as InjectedScriptStage
}.js`;
export const PAGE_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${'page' as InjectedScriptStage}.js`;
export const PAGE_SSR_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${'page-ssr' as InjectedScriptStage}.js`;

export default function astroScriptsPlugin({ config }: { config: AstroConfig }): VitePlugin {
	let env: ConfigEnv | undefined = undefined;
	return {
		name: 'astro:scripts',

		config(_config, _env) {
			env = _env;
		},

		async resolveId(id) {
			if (id.startsWith(SCRIPT_ID_PREFIX)) {
				return id;
			}
			return undefined;
		},

		async load(id) {
			if (id === BEFORE_HYDRATION_SCRIPT_ID) {
				return config._ctx.scripts
					.filter((s) => s.stage === 'before-hydration')
					.map((s) => s.content)
					.join('\n');
			}
			if (id === PAGE_SCRIPT_ID) {
				return config._ctx.scripts
					.filter((s) => s.stage === 'page')
					.map((s) => s.content)
					.join('\n');
			}
			if (id === PAGE_SSR_SCRIPT_ID) {
				return config._ctx.scripts
					.filter((s) => s.stage === 'page-ssr')
					.map((s) => s.content)
					.join('\n');
			}
			return null;
		},
		buildStart(options) {
			const hasHydrationScripts = config._ctx.scripts.some((s) => s.stage === 'before-hydration');
			if (hasHydrationScripts && env?.command === 'build' && !env?.ssrBuild) {
				this.emitFile({
					type: 'chunk',
					id: BEFORE_HYDRATION_SCRIPT_ID,
					name: BEFORE_HYDRATION_SCRIPT_ID,
				});
			}
		},
	};
}
