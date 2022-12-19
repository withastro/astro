import type { Plugin as VitePlugin } from 'vite';
import type { AstroAdapter } from '../../@types/astro';
import type { SerializedRouteInfo, SerializedSSRManifest } from '../app/types';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types';

import glob from 'fast-glob';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { runHookBuildSsr } from '../../integrations/index.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { pagesVirtualModuleId } from '../app/index.js';
import { removeLeadingForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { serializeRouteData } from '../routing/index.js';
import { addRollupInput } from './add-rollup-input.js';
import { getOutFile, getOutFolder } from './common.js';
import { eachPrerenderedPageData, eachServerPageData, sortedCSS } from './internal.js';

export const virtualModuleId = '@astrojs-ssr-virtual-entry';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const manifestReplace = '@@ASTRO_MANIFEST_REPLACE@@';
const replaceExp = new RegExp(`['"](${manifestReplace})['"]`, 'g');

export function vitePluginSSR(internals: BuildInternals, adapter: AstroAdapter): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-astro-ssr',
		enforce: 'post',
		options(opts) {
			return addRollupInput(opts, [virtualModuleId]);
		},
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `import * as adapter from '${adapter.serverEntrypoint}';
import * as _main from '${pagesVirtualModuleId}';
import { deserializeManifest as _deserializeManifest } from 'astro/app';
const _manifest = Object.assign(_deserializeManifest('${manifestReplace}'), {
	pageMap: _main.pageMap,
	renderers: _main.renderers
});
const _args = ${adapter.args ? JSON.stringify(adapter.args) : 'undefined'};

export * from '${pagesVirtualModuleId}';

${
	adapter.exports
		? `const _exports = adapter.createExports(_manifest, _args);
${adapter.exports
	.map((name) => {
		if (name === 'default') {
			return `const _default = _exports['default'];
export { _default as default };`;
		} else {
			return `export const ${name} = _exports['${name}'];`;
		}
	})
	.join('\n')}
`
		: ''
}
const _start = 'start';
if(_start in adapter) {
	adapter[_start](_manifest, _args);
}`;
			}
			return void 0;
		},
		async generateBundle(_opts, bundle) {
			// Add assets from this SSR chunk as well.
			for (const [_chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					internals.staticFiles.add(chunk.fileName);
				}
			}

			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				if (chunk.modules[resolvedVirtualModuleId]) {
					internals.ssrEntryChunk = chunk;
					delete bundle[chunkName];
				}
			}
		},
	};
}

export async function injectManifest(buildOpts: StaticBuildOptions, internals: BuildInternals) {
	if (!internals.ssrEntryChunk) {
		throw new Error(`Did not generate an entry chunk for SSR`);
	}

	// Add assets from the client build.
	const clientStatics = new Set(
		await glob('**/*', {
			cwd: fileURLToPath(buildOpts.buildConfig.client),
		})
	);
	for (const file of clientStatics) {
		internals.staticFiles.add(file);
	}

	const staticFiles = internals.staticFiles;
	const manifest = buildManifest(buildOpts, internals, Array.from(staticFiles));
	await runHookBuildSsr({
		config: buildOpts.settings.config,
		manifest,
		logging: buildOpts.logging,
	});

	const chunk = internals.ssrEntryChunk;
	const code = chunk.code;
	chunk.code = code.replace(replaceExp, () => {
		return JSON.stringify(manifest);
	});
	const serverEntryURL = new URL(buildOpts.buildConfig.serverEntry, buildOpts.buildConfig.server);
	await fs.promises.mkdir(new URL('./', serverEntryURL), { recursive: true });
	await fs.promises.writeFile(serverEntryURL, chunk.code, 'utf-8');
}

function buildManifest(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	staticFiles: string[]
): SerializedSSRManifest {
	const { settings } = opts;

	const routes: SerializedRouteInfo[] = [];
	const entryModules = Object.fromEntries(internals.entrySpecifierToBundleMap.entries());
	if (settings.scripts.some((script) => script.stage === 'page')) {
		staticFiles.push(entryModules[PAGE_SCRIPT_ID]);
	}

	const bareBase = removeTrailingForwardSlash(removeLeadingForwardSlash(settings.config.base));
	const joinBase = (pth: string) => (bareBase ? bareBase + '/' + pth : pth);

	for (const pageData of eachPrerenderedPageData(internals)) {
		const outFolder = getOutFolder(
			opts.settings.config,
			pageData.route.pathname!,
			pageData.route.type
		);
		const outFile = getOutFile(
			opts.settings.config,
			outFolder,
			pageData.route.pathname!,
			pageData.route.type
		);
		const file = outFile.toString().replace(opts.settings.config.build.client.toString(), '');
		routes.push({
			file,
			links: [],
			scripts: [],
			routeData: serializeRouteData(pageData.route, settings.config.trailingSlash),
		});
		staticFiles.push(file);
	}

	for (const pageData of eachServerPageData(internals)) {
		const scripts: SerializedRouteInfo['scripts'] = [];
		if (pageData.hoistedScript) {
			scripts.unshift(
				Object.assign({}, pageData.hoistedScript, {
					value: joinBase(pageData.hoistedScript.value),
				})
			);
		}
		if (settings.scripts.some((script) => script.stage === 'page')) {
			const src = entryModules[PAGE_SCRIPT_ID];

			scripts.push({
				type: 'external',
				value: joinBase(src),
			});
		}

		const links = sortedCSS(pageData).map((pth) => joinBase(pth));

		routes.push({
			file: '',
			links,
			scripts: [
				...scripts,
				...settings.scripts
					.filter((script) => script.stage === 'head-inline')
					.map(({ stage, content }) => ({ stage, children: content })),
			],
			routeData: serializeRouteData(pageData.route, settings.config.trailingSlash),
		});
	}

	// HACK! Patch this special one.
	if (!(BEFORE_HYDRATION_SCRIPT_ID in entryModules)) {
		// Set this to an empty string so that the runtime knows not to try and load this.
		entryModules[BEFORE_HYDRATION_SCRIPT_ID] = '';
	}

	const ssrManifest: SerializedSSRManifest = {
		adapterName: opts.settings.adapter!.name,
		routes,
		site: settings.config.site,
		base: settings.config.base,
		markdown: {
			...settings.config.markdown,
			isAstroFlavoredMd: settings.config.legacy.astroFlavoredMarkdown,
			isExperimentalContentCollections: settings.config.experimental.contentCollections,
		},
		pageMap: null as any,
		renderers: [],
		entryModules,
		assets: staticFiles.map((s) => settings.config.base + s),
	};

	return ssrManifest;
}
