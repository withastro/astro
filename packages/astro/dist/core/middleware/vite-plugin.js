import { fileURLToPath } from 'node:url';
import { normalizePath as viteNormalizePath } from 'vite';
import { getServerOutputDirectory } from '../../prerender/utils.js';
import { addRollupInput } from '../build/add-rollup-input.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES, MIDDLEWARE_PATH_SEGMENT_NAME } from '../constants.js';
import { MissingMiddlewareForInternationalization } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizePath } from '../viteUtils.js';
const MIDDLEWARE_MODULE_ID = 'virtual:astro:middleware';
const MIDDLEWARE_RESOLVED_MODULE_ID = '\0' + MIDDLEWARE_MODULE_ID;
const NOOP_MIDDLEWARE = '\0noop-middleware';
function vitePluginMiddleware({ settings }) {
	let resolvedMiddlewareId = void 0;
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
		configureServer(server) {
			server.watcher.on('change', (path) => {
				const normalizedPath = viteNormalizePath(path);
				if (!normalizedPath.startsWith(normalizedSrcDir)) return;
				const relativePath = normalizedPath.slice(normalizedSrcDir.length);
				if (!relativePath.startsWith(`${MIDDLEWARE_PATH_SEGMENT_NAME}.`)) return;
				for (const name of [ASTRO_VITE_ENVIRONMENT_NAMES.ssr, ASTRO_VITE_ENVIRONMENT_NAMES.astro]) {
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
				${userMiddlewareIsPresent ? `import { onRequest as userOnRequest } from '${resolvedMiddlewareId}';` : ''}
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
function createMiddlewareImports(entrypoints, prefix) {
	let importsRaw = '';
	let sequenceRaw = '';
	let index = 0;
	for (const entrypoint of entrypoints) {
		const name = `_${prefix}_${index}`;
		importsRaw += `import { onRequest as ${name} } from '${normalizePath(entrypoint)}';
`;
		sequenceRaw += `${index > 0 ? ',' : ''}${name}`;
		index++;
	}
	return {
		importsCode: importsRaw,
		sequenceCode: sequenceRaw,
	};
}
function vitePluginMiddlewareBuild(opts, internals) {
	let canSplitMiddleware = true;
	return {
		name: '@astro/plugin-middleware-build',
		configResolved(config) {
			canSplitMiddleware = config.ssr.target !== 'webworker';
		},
		options(options) {
			if (canSplitMiddleware) {
				return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
			} else {
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
export { MIDDLEWARE_MODULE_ID, vitePluginMiddleware, vitePluginMiddlewareBuild };
