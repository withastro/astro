import { fileURLToPath } from 'node:url';
import {
	normalizePath as viteNormalizePath,
	type EnvironmentModuleNode,
	type ViteDevServer,
	type Plugin as VitePlugin,
} from 'vite';
import { isAstroServerEnvironment } from '../../environments.js';
import { getServerOutputDirectory } from '../../prerender/utils.js';
import type { AstroSettings } from '../../types/astro.js';
import { addRolldownInput } from '../build/add-rolldown-input.js';
import type { BuildInternals } from '../build/internal.js';
import type { StaticBuildOptions } from '../build/types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES, MIDDLEWARE_PATH_SEGMENT_NAME } from '../constants.js';
import { MissingMiddlewareForInternationalization } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizePath } from '../viteUtils.js';

// This module name is used in Cloudflare's optimizedDeps configuration,
// if th name changes that needs to be updated as well.
export const MIDDLEWARE_MODULE_ID = 'virtual:astro:middleware';
const MIDDLEWARE_RESOLVED_MODULE_ID = '\0' + MIDDLEWARE_MODULE_ID;
const NOOP_MIDDLEWARE = '\0noop-middleware';

export function isMiddlewarePath(relativePath: string): boolean {
	return (
		relativePath.startsWith(`${MIDDLEWARE_PATH_SEGMENT_NAME}.`) ||
		relativePath.startsWith(`${MIDDLEWARE_PATH_SEGMENT_NAME}/`)
	);
}

export function vitePluginMiddleware({ settings }: { settings: AstroSettings }): VitePlugin {
	let resolvedMiddlewareId: string | undefined = undefined;
	const hasIntegrationMiddleware =
		settings.middlewares.pre.length > 0 || settings.middlewares.post.length > 0;
	let userMiddlewareIsPresent = false;

	const normalizedSrcDir = viteNormalizePath(fileURLToPath(settings.config.srcDir));

	return {
		name: '@astro/plugin-middleware',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configureServer(server: ViteDevServer) {
			server.watcher.on('change', (path) => {
				const normalizedPath = viteNormalizePath(path);
				// Check if the changed file is a middleware file under srcDir
				if (!normalizedPath.startsWith(normalizedSrcDir)) return;
				const relativePath = normalizedPath.slice(normalizedSrcDir.length);
				if (!isMiddlewarePath(relativePath)) return;

				for (const name of [
					ASTRO_VITE_ENVIRONMENT_NAMES.ssr,
					ASTRO_VITE_ENVIRONMENT_NAMES.astro,
				] as const) {
					const environment = server.environments[name];
					if (!environment) continue;

					const virtualMod = environment.moduleGraph.getModuleById(MIDDLEWARE_RESOLVED_MODULE_ID);
					if (virtualMod) {
						environment.moduleGraph.invalidateModule(virtualMod);
					}

					environment.hot.send('astro:middleware-updated', {});
				}
			});
		},
		hotUpdate: {
			handler({ modules }) {
				if (!isAstroServerEnvironment(this.environment)) return;

				const middlewareVirtualMod =
					this.environment.moduleGraph.getModuleById(MIDDLEWARE_RESOLVED_MODULE_ID);
				if (!middlewareVirtualMod) return;

				for (const mod of modules) {
					if (isTransitiveImporterOf(mod, MIDDLEWARE_RESOLVED_MODULE_ID)) {
						this.environment.moduleGraph.invalidateModule(middlewareVirtualMod);
						this.environment.hot.send('astro:middleware-updated', {});
						return;
					}
				}
			},
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${MIDDLEWARE_MODULE_ID}$`),
			},
			async handler() {
				const middlewareId = await this.resolve(
					`${decodeURI(settings.config.srcDir.pathname)}${MIDDLEWARE_PATH_SEGMENT_NAME}`,
				);
				userMiddlewareIsPresent = !!middlewareId;
				if (middlewareId) {
					resolvedMiddlewareId = middlewareId.id;
					return MIDDLEWARE_RESOLVED_MODULE_ID;
				} else if (hasIntegrationMiddleware) {
					return MIDDLEWARE_RESOLVED_MODULE_ID;
				} else {
					return NOOP_MIDDLEWARE;
				}
			},
		},
		load: {
			filter: {
				id: new RegExp(`^(${NOOP_MIDDLEWARE}|${MIDDLEWARE_RESOLVED_MODULE_ID})$`),
			},
			async handler(id) {
				if (id === NOOP_MIDDLEWARE) {
					if (!userMiddlewareIsPresent && settings.config.i18n?.routing === 'manual') {
						throw new AstroError(MissingMiddlewareForInternationalization);
					}
					return { code: 'export const onRequest = (_, next) => next()' };
				}
				if (id === MIDDLEWARE_RESOLVED_MODULE_ID) {
					if (!userMiddlewareIsPresent && settings.config.i18n?.routing === 'manual') {
						throw new AstroError(MissingMiddlewareForInternationalization);
					}

					const preMiddleware = createMiddlewareImports(settings.middlewares.pre, 'pre');
					const postMiddleware = createMiddlewareImports(settings.middlewares.post, 'post');

					const code = `
				${
					userMiddlewareIsPresent
						? `import { onRequest as userOnRequest } from '${resolvedMiddlewareId}';`
						: ''
				}
import { sequence } from 'astro:middleware';
${preMiddleware.importsCode}${postMiddleware.importsCode}

export const onRequest = sequence(
	${preMiddleware.sequenceCode}${preMiddleware.sequenceCode ? ',' : ''}
	${userMiddlewareIsPresent ? `userOnRequest${postMiddleware.sequenceCode ? ',' : ''}` : ''}
	${postMiddleware.sequenceCode}
);
`.trim();

					return { code };
				}
			},
		},
	};
}

/**
 * Walks up the `importers` chain from `mod` to check whether the module
 * with the given `targetId` transitively imports it.
 */
export function isTransitiveImporterOf(
	mod: EnvironmentModuleNode,
	targetId: string,
	seen = new Set<EnvironmentModuleNode>(),
): boolean {
	if (seen.has(mod)) return false;
	seen.add(mod);
	for (const importer of mod.importers) {
		if (importer.id === targetId) return true;
		if (isTransitiveImporterOf(importer, targetId, seen)) return true;
	}
	return false;
}

function createMiddlewareImports(
	entrypoints: string[],
	prefix: string,
): {
	importsCode: string;
	sequenceCode: string;
} {
	let importsRaw = '';
	let sequenceRaw = '';
	let index = 0;
	for (const entrypoint of entrypoints) {
		const name = `_${prefix}_${index}`;
		importsRaw += `import { onRequest as ${name} } from '${normalizePath(entrypoint)}';\n`;
		sequenceRaw += `${index > 0 ? ',' : ''}${name}`;
		index++;
	}

	return {
		importsCode: importsRaw,
		sequenceCode: sequenceRaw,
	};
}

export function vitePluginMiddlewareBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	let canSplitMiddleware = true;
	return {
		name: '@astro/plugin-middleware-build',

		configResolved(config) {
			// Cloudflare Workers (webworker target) can't have multiple entrypoints,
			// so we only add middleware as a separate bundle for other targets (Node, Deno, etc).
			canSplitMiddleware = config.ssr.target !== 'webworker';
		},

		options(options) {
			if (canSplitMiddleware) {
				// Add middleware as a separate rolldown input for environments that support multiple entrypoints.
				// This allows the middleware to be bundled independently.
				return addRolldownInput(options, [MIDDLEWARE_MODULE_ID]);
			} else {
				// TODO warn if edge middleware is enabled
			}
		},

		writeBundle(_, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type !== 'asset' && chunk.facadeModuleId === MIDDLEWARE_RESOLVED_MODULE_ID) {
					const outputDirectory = getServerOutputDirectory(opts.settings);
					internals.middlewareEntryPoint = new URL(chunkName, outputDirectory);
				}
			}
		},
	};
}
