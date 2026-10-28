import * as devalue from 'devalue';
import type { Environment, EnvironmentOptions, Plugin as VitePlugin } from 'vite';
import type { AstroRenderer } from '@astrojs/runtime/types';
import { ASTRO_RENDERERS_MODULE_ID, RESOLVED_ASTRO_RENDERERS_MODULE_ID } from './const.js';

export { ASTRO_RENDERERS_MODULE_ID };

export interface RenderersPluginOptions {
	renderers: AstroRenderer[];
	/**
	 * Return `true` to emit an empty renderer list for an environment that never renders framework
	 * components, so their server code is left out of its bundle.
	 */
	skipRenderers?: (environment: Environment) => boolean;
}

/**
 * Serves `virtual:astro:renderers`, which exports the loaded renderers as `renderers`, and applies
 * the dependency fields of the renderers (`optimizeDeps`, `dedupe`, `noExternal`) to each
 * environment.
 */
export default function vitePluginRenderers({
	renderers,
	skipRenderers,
}: RenderersPluginOptions): VitePlugin {
	return {
		name: 'astro:plugin-renderers',
		enforce: 'pre',
		// Internal, undocumented: lets adapters (e.g. @astrojs/cloudflare) read the
		// registered renderers from the plugin chain to pre-bundle their server
		// entrypoints (see https://github.com/withastro/astro/issues/17921).
		renderers,

		configEnvironment: {
			// After other plugins, so that `optimizeDeps.noDiscovery` set by them (adapters for
			// non-Node runtimes) decides whether a server environment pre-bundles.
			order: 'post',
			handler(name, environmentOptions) {
				const consumer = environmentOptions.consumer ?? (name === 'client' ? 'client' : 'server');
				return getRendererEnvironmentOptions(renderers, consumer, environmentOptions);
			},
		},

		resolveId: {
			filter: {
				id: new RegExp(`^${ASTRO_RENDERERS_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_ASTRO_RENDERERS_MODULE_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_ASTRO_RENDERERS_MODULE_ID}$`),
			},
			handler() {
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
}

/** The fields of a renderer that `astro()` applies itself, left out of `virtual:astro:renderers`. */
const BUILD_FIELDS = ['optimizeDeps', 'dedupe', 'noExternal', 'devHeadScript'] as const;

function serializeRenderer(renderer: AstroRenderer): string {
	const { options, ...rest } = renderer;
	for (const field of BUILD_FIELDS) delete rest[field];
	const json = JSON.stringify(rest);
	if (options === undefined) return json;
	return `Object.assign(${json}, { options: ${devalue.uneval(options)} })`;
}

function getRendererEnvironmentOptions(
	renderers: readonly AstroRenderer[],
	consumer: 'client' | 'server',
	environmentOptions: EnvironmentOptions,
): EnvironmentOptions | undefined {
	const dedupe = renderers.flatMap((renderer) => renderer.dedupe ?? []);
	const noExternal =
		consumer === 'server' ? renderers.flatMap((renderer) => renderer.noExternal ?? []) : [];
	// Server environments pre-bundle only when they run the dependency optimizer.
	const optimizes = consumer === 'client' || environmentOptions.optimizeDeps?.noDiscovery === false;
	const include = optimizes
		? renderers.flatMap((renderer) => renderer.optimizeDeps?.[consumer]?.include ?? [])
		: [];
	const exclude = optimizes
		? renderers.flatMap((renderer) => renderer.optimizeDeps?.[consumer]?.exclude ?? [])
		: [];
	if (!dedupe.length && !noExternal.length && !include.length && !exclude.length) return;
	return {
		resolve: {
			dedupe,
			// `true` already bundles every dependency.
			noExternal: environmentOptions.resolve?.noExternal === true ? undefined : noExternal,
		},
		optimizeDeps: { include, exclude },
	};
}
