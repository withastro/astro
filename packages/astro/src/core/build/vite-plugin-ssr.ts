import type { OutputBundle, OutputChunk } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from './internal.js';
import type { AstroAdapter } from '../../@types/astro';
import type { StaticBuildOptions } from './types';
import type { SerializedRouteInfo, SerializedSSRManifest } from '../app/types';

import { chunkIsPage, rootRelativeFacadeId, getByFacadeId } from './generate.js';
import { serializeRouteData } from '../routing/index.js';

const virtualModuleId = '@astrojs-ssr-virtual-entry';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const manifestReplace = '@@ASTRO_MANIFEST_REPLACE@@';

export function vitePluginSSR(buildOpts: StaticBuildOptions, internals: BuildInternals, adapter: AstroAdapter): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-ssr',
		options(opts) {
			if (Array.isArray(opts.input)) {
				opts.input.push(virtualModuleId);
			} else {
				return {
					input: [virtualModuleId],
				};
			}
		},
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `import * as adapter from '${adapter.serverEntrypoint}';
import { deserializeManifest as _deserializeManifest } from 'astro/app';
const _manifest = _deserializeManifest('${manifestReplace}');

${
	adapter.exports
		? `const _exports = adapter.createExports(_manifest);
${adapter.exports.map((name) => `export const ${name} = _exports['${name}'];`).join('\n')}
`
		: ''
}
const _start = 'start';
if(_start in adapter) {
	adapter[_start](_manifest);
}`;
			}
			return void 0;
		},

		generateBundle(opts, bundle) {
			const manifest = buildManifest(bundle, buildOpts, internals);

			for (const [_chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') continue;
				if (chunk.modules[resolvedVirtualModuleId]) {
					const exp = new RegExp(`['"]${manifestReplace}['"]`);
					const code = chunk.code;
					chunk.code = code.replace(exp, () => {
						return JSON.stringify(manifest);
					});
					chunk.fileName = 'entry.mjs';
				}
			}
		},
	};
}

function buildManifest(bundle: OutputBundle, opts: StaticBuildOptions, internals: BuildInternals): SerializedSSRManifest {
	const { astroConfig, manifest } = opts;

	const rootRelativeIdToChunkMap = new Map<string, OutputChunk>();
	for (const [_outputName, output] of Object.entries(bundle)) {
		if (chunkIsPage(astroConfig, output, internals)) {
			const chunk = output as OutputChunk;
			if (chunk.facadeModuleId) {
				const id = rootRelativeFacadeId(chunk.facadeModuleId, astroConfig);
				rootRelativeIdToChunkMap.set(id, chunk);
			}
		}
	}

	const routes: SerializedRouteInfo[] = [];

	for (const routeData of manifest.routes) {
		const componentPath = routeData.component;

		if (!rootRelativeIdToChunkMap.has(componentPath)) {
			throw new Error('Unable to find chunk for ' + componentPath);
		}

		const chunk = rootRelativeIdToChunkMap.get(componentPath)!;
		const facadeId = chunk.facadeModuleId!;
		const links = getByFacadeId<string[]>(facadeId, internals.facadeIdToAssetsMap) || [];
		const hoistedScript = getByFacadeId<string>(facadeId, internals.facadeIdToHoistedEntryMap);
		const scripts = hoistedScript ? [hoistedScript] : [];

		routes.push({
			file: chunk.fileName,
			links,
			scripts,
			routeData: serializeRouteData(routeData),
		});
	}

	// HACK! Patch this special one.
	const entryModules = Object.fromEntries(internals.entrySpecifierToBundleMap.entries());
	entryModules['astro:scripts/before-hydration.js'] = 'data:text/javascript;charset=utf-8,//[no before-hydration script]';

	const ssrManifest: SerializedSSRManifest = {
		routes,
		site: astroConfig.buildOptions.site,
		markdown: {
			render: astroConfig.markdownOptions.render,
		},
		renderers: astroConfig._ctx.renderers,
		entryModules,
	};

	return ssrManifest;
}
