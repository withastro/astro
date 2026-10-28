import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as devalue from 'devalue';
import MagicString from 'magic-string';
import type { Environment, EnvironmentOptions, Plugin as VitePlugin } from 'vite';
import type { AstroRenderer } from '@astrojs/runtime/types';
import {
	APP_ENTRYPOINT_MODULE_PREFIX,
	ASTRO_RENDERERS_MODULE_ID,
	RESOLVED_APP_ENTRYPOINT_MODULE_PREFIX,
	RESOLVED_ASTRO_RENDERERS_MODULE_ID,
} from './const.js';

export { ASTRO_RENDERERS_MODULE_ID };

export interface RenderersPluginOptions {
	renderers: AstroRenderer[];
	/** `AstroPluginOptions.root`: the project root, resolved against Vite's `root`. */
	root?: string;
	/**
	 * Return `true` to emit an empty renderer list for an environment that never renders framework
	 * components, so their server code is left out of its bundle.
	 */
	skipRenderers?: (environment: Environment) => boolean;
}

/**
 * Serves `virtual:astro:renderers`, which exports the loaded renderers as `renderers`, and the
 * `virtual:astro:app-entrypoint/<name>` modules of the renderers; applies their dependency fields
 * (`optimizeDeps`, `dedupe`, `noExternal`) to each environment.
 */
export default function vitePluginRenderers({
	renderers,
	root,
	skipRenderers,
}: RenderersPluginOptions): VitePlugin[] {
	let projectRoot = '';
	const noExternals = new Map<AstroRenderer, Promise<string[]>>();
	function getNoExternal(renderer: AstroRenderer): Promise<string[]> {
		const { noExternal } = renderer;
		if (typeof noExternal !== 'function') return Promise.resolve(noExternal ?? []);
		// Computed once: the function may crawl the project's dependencies.
		let result = noExternals.get(renderer);
		if (!result) {
			result = Promise.resolve(noExternal({ root: pathToFileURL(projectRoot + path.sep) }));
			noExternals.set(renderer, result);
		}
		return result;
	}
	function getAppEntrypoint(renderer: AstroRenderer): string | undefined {
		const { appEntrypoint } = renderer;
		return appEntrypoint?.startsWith('.')
			? path.resolve(projectRoot, appEntrypoint)
			: appEntrypoint;
	}
	const appEntrypointImporters = renderers.flatMap((renderer) =>
		renderer.appEntrypoint && renderer.appEntrypointImporters ? [renderer] : [],
	);

	const plugin: VitePlugin = {
		name: 'astro:plugin-renderers',
		enforce: 'pre',
		// Internal, undocumented: lets adapters (e.g. @astrojs/cloudflare) read the
		// registered renderers from the plugin chain to pre-bundle their server
		// entrypoints (see https://github.com/withastro/astro/issues/17921).
		renderers,

		config(config) {
			projectRoot = path.resolve(
				config.root ? path.resolve(config.root) : process.cwd(),
				root ?? '.',
			);
		},

		configEnvironment: {
			// After other plugins, so that `optimizeDeps.noDiscovery` set by them (adapters for
			// non-Node runtimes) decides whether a server environment pre-bundles.
			order: 'post',
			handler(name, environmentOptions) {
				const consumer = environmentOptions.consumer ?? (name === 'client' ? 'client' : 'server');
				return getRendererEnvironmentOptions(
					renderers,
					consumer,
					environmentOptions,
					getNoExternal,
				);
			},
		},

		resolveId: {
			filter: {
				id: [
					new RegExp(`^${ASTRO_RENDERERS_MODULE_ID}$`),
					new RegExp(`^${APP_ENTRYPOINT_MODULE_PREFIX}`),
				],
			},
			handler(id) {
				return '\0' + id;
			},
		},

		load: {
			filter: {
				id: [
					new RegExp(`^${RESOLVED_ASTRO_RENDERERS_MODULE_ID}$`),
					new RegExp(`^${RESOLVED_APP_ENTRYPOINT_MODULE_PREFIX}`),
				],
			},
			handler(id) {
				if (id.startsWith(RESOLVED_APP_ENTRYPOINT_MODULE_PREFIX)) {
					const name = id.slice(RESOLVED_APP_ENTRYPOINT_MODULE_PREFIX.length);
					const renderer = renderers.find((r) => r.name === name && r.appEntrypoint);
					const appEntrypoint = renderer && getAppEntrypoint(renderer);
					return {
						code: appEntrypoint
							? `export default () => import(${JSON.stringify(appEntrypoint)});`
							: 'export default undefined;',
					};
				}
				if (renderers.length > 0 && skipRenderers?.(this.environment)) {
					return { code: `export const renderers = [];` };
				}

				if (renderers.length > 0) {
					const imports: string[] = [];
					const exports: string[] = [];
					let i = 0;
					let rendererItems = '';

					for (const renderer of renderers) {
						const variable = `_renderer${i}`;
						imports.push(`import ${variable} from ${JSON.stringify(renderer.serverEntrypoint)};`);
						rendererItems += `Object.assign(${serializeRenderer(renderer)}, { ssr: ${variable} }),`;
						i++;
					}

					exports.push(`export const renderers = [${rendererItems}];`);

					return { code: `${imports.join('\n')}\n${exports.join('\n')}` };
				}
				return { code: `export const renderers = [];` };
			},
		},
	} as VitePlugin & { renderers: typeof renderers };

	const appEntrypointPlugin: VitePlugin = {
		name: 'astro:plugin-renderers-app-entrypoint',
		// After the framework plugins, which compile the importers to JavaScript, and
		// before Vite's import analysis, so that the dev module graph has the import.
		enforce: 'post',
		transform: {
			filter: {
				id: appEntrypointImporters.map((renderer) => renderer.appEntrypointImporters!),
			},
			handler(code, id) {
				const s = new MagicString(code);
				for (const renderer of appEntrypointImporters) {
					if (renderer.appEntrypointImporters!.test(id)) {
						s.prepend(`import ${JSON.stringify(getAppEntrypoint(renderer))};\n`);
					}
				}
				return { code: s.toString(), map: s.generateMap({ hires: 'boundary' }) };
			},
		},
	};

	return [
		plugin,
		...(appEntrypointImporters.length > 0 ? [appEntrypointPlugin] : []),
		{
			name: 'astro:plugin-renderers-exclude',
			// Before the `configEnvironment` hooks of framework plugins, which read
			// `optimizeDeps.exclude`: vite-plugin-svelte pre-bundles Svelte's server runtime unless
			// `svelte` is excluded.
			enforce: 'pre',
			configEnvironment(name, environmentOptions) {
				const consumer = environmentOptions.consumer ?? (name === 'client' ? 'client' : 'server');
				const exclude = renderers.flatMap(
					(renderer) => renderer.optimizeDeps?.[consumer]?.exclude ?? [],
				);
				if (exclude.length) return { optimizeDeps: { exclude } };
			},
		},
	];
}

/** The fields of a renderer that `astro()` applies itself, left out of `virtual:astro:renderers`. */
const BUILD_FIELDS = [
	'optimizeDeps',
	'dedupe',
	'noExternal',
	'devHeadScript',
	'appEntrypoint',
	'appEntrypointImporters',
] as const;

function serializeRenderer(renderer: AstroRenderer): string {
	const { options, ...rest } = renderer;
	for (const field of BUILD_FIELDS) delete rest[field];
	const json = JSON.stringify(rest);
	if (options === undefined) return json;
	return `Object.assign(${json}, { options: ${devalue.uneval(options)} })`;
}

async function getRendererEnvironmentOptions(
	renderers: readonly AstroRenderer[],
	consumer: 'client' | 'server',
	environmentOptions: EnvironmentOptions,
	getNoExternal: (renderer: AstroRenderer) => Promise<string[]>,
): Promise<EnvironmentOptions | undefined> {
	const dedupe = renderers.flatMap((renderer) => renderer.dedupe ?? []);
	// `true` already bundles every dependency.
	const noExternal =
		consumer === 'server' && environmentOptions.resolve?.noExternal !== true
			? (await Promise.all(renderers.map(getNoExternal))).flat()
			: [];
	// Server environments pre-bundle only when they run the dependency optimizer.
	const optimizes = consumer === 'client' || environmentOptions.optimizeDeps?.noDiscovery === false;
	const include = optimizes
		? renderers.flatMap((renderer) => renderer.optimizeDeps?.[consumer]?.include ?? [])
		: [];
	if (!dedupe.length && !noExternal.length && !include.length) return;
	return {
		resolve: { dedupe, noExternal },
		optimizeDeps: { include },
	};
}
