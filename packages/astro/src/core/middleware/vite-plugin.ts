import type { Plugin as VitePlugin } from 'vite';
import { getServerOutputDirectory } from '../../prerender/utils.js';
import type { AstroSettings } from '../../types/astro.js';
import { addRollupInput } from '../build/add-rollup-input.js';
import type { BuildInternals } from '../build/internal.js';
import type { StaticBuildOptions } from '../build/types.js';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../constants.js';
import { MissingMiddlewareForInternationalization } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizePath } from '../viteUtils.js';

export const MIDDLEWARE_MODULE_ID = 'virtual:astro:middleware';
const MIDDLEWARE_RESOLVED_MODULE_ID = '\0' + MIDDLEWARE_MODULE_ID;
const NOOP_MIDDLEWARE = '\0noop-middleware';

export function vitePluginMiddleware({ settings }: { settings: AstroSettings }): VitePlugin {
	let resolvedMiddlewareId: string | undefined = undefined;
	const hasIntegrationMiddleware =
		settings.middlewares.pre.length > 0 || settings.middlewares.post.length > 0;
	let userMiddlewareIsPresent = false;

	return {
		name: '@astro/plugin-middleware',
		applyToEnvironment(environment) {
			return environment.name === 'ssr' || environment.name === 'astro' || environment.name === 'prerender';
		},
		async resolveId(id) {
			if (id === MIDDLEWARE_MODULE_ID) {
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
			}
			if (id === NOOP_MIDDLEWARE) {
				return NOOP_MIDDLEWARE;
			}
		},
		async load(id) {
			if (id === NOOP_MIDDLEWARE) {
				if (!userMiddlewareIsPresent && settings.config.i18n?.routing === 'manual') {
					throw new AstroError(MissingMiddlewareForInternationalization);
				}
				return { code: 'export const onRequest = (_, next) => next()' };
			} else if (id === MIDDLEWARE_RESOLVED_MODULE_ID) {
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
	};
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
			if(canSplitMiddleware) {
				// Add middleware as a separate rollup input for environments that support multiple entrypoints.
				// This allows the middleware to be bundled independently.
				return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
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
