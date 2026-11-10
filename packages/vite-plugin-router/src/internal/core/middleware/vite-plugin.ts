import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES, MIDDLEWARE_PATH_SEGMENT_NAME } from '../constants.js';
import { normalizePath } from '../viteUtils.js';
import { isAstroServerEnvironment } from '../../environments.js';
import type { RouterRegistry } from '../../registry.js';

// `sequence()`, imported by absolute path: projects that depend only on `astro` cannot resolve
// this package.
const SEQUENCE_MODULE = normalizePath(fileURLToPath(new URL('./sequence.js', import.meta.url)));

// This module name is used in Cloudflare's optimizedDeps configuration,
// if th name changes that needs to be updated as well.
export const MIDDLEWARE_MODULE_ID = 'virtual:astro:middleware';
export const MIDDLEWARE_RESOLVED_MODULE_ID = '\0' + MIDDLEWARE_MODULE_ID;
const NOOP_MIDDLEWARE = '\0noop-middleware';

export function isMiddlewarePath(relativePath: string): boolean {
	return (
		relativePath.startsWith(`${MIDDLEWARE_PATH_SEGMENT_NAME}.`) ||
		relativePath.startsWith(`${MIDDLEWARE_PATH_SEGMENT_NAME}/`)
	);
}

export interface MiddlewarePluginOptions {
	routerRegistry: RouterRegistry;
	/** Runs when the middleware module is loaded; throws to reject the project's middleware. */
	validate?: (context: { userMiddlewareIsPresent: boolean }) => void;
}

/** Composes `src/middleware` and the registered middleware into `virtual:astro:middleware`. */
export function vitePluginMiddleware({
	routerRegistry,
	validate,
}: MiddlewarePluginOptions): VitePlugin {
	let resolvedMiddlewareId: string | undefined = undefined;
	const registeredMiddleware = routerRegistry.middleware;
	let userMiddlewareIsPresent = false;

	return {
		name: '@astro/plugin-middleware',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		hotUpdate: {
			handler(ctx) {
				if (!isAstroServerEnvironment(this.environment)) return;

				// A change that matched no modules in the graph can't affect the
				// middleware or anything it imports, so there's nothing to invalidate.
				// Writes outside the graph (e.g. `@astrojs/cloudflare`'s `.wrangler/state`)
				// fire a hotUpdate per write and would otherwise reload the middleware
				// on every request.
				// https://github.com/withastro/astro/issues/17933
				if (ctx.modules.length === 0) return;

				const middlewareVirtualMod = this.environment.moduleGraph.getModuleById(
					MIDDLEWARE_RESOLVED_MODULE_ID,
				);
				if (!middlewareVirtualMod) return;

				this.environment.moduleGraph.invalidateModule(middlewareVirtualMod);
				this.environment.hot.send('astro:middleware-updated', {});
			},
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${MIDDLEWARE_MODULE_ID}$`),
			},
			async handler() {
				const middlewareId = await this.resolve(
					`${decodeURI(routerRegistry.config.srcDir.pathname)}${MIDDLEWARE_PATH_SEGMENT_NAME}`,
				);
				userMiddlewareIsPresent = !!middlewareId;
				if (middlewareId) {
					resolvedMiddlewareId = middlewareId.id;
					return MIDDLEWARE_RESOLVED_MODULE_ID;
				} else if (registeredMiddleware.pre.length > 0 || registeredMiddleware.post.length > 0) {
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
					validate?.({ userMiddlewareIsPresent });
					return { code: 'export const onRequest = (_, next) => next()' };
				}
				if (id === MIDDLEWARE_RESOLVED_MODULE_ID) {
					validate?.({ userMiddlewareIsPresent });

					routerRegistry.freeze();
					const preMiddleware = createMiddlewareImports(registeredMiddleware.pre, 'pre');
					const postMiddleware = createMiddlewareImports(registeredMiddleware.post, 'post');

					const code = `
				${
					userMiddlewareIsPresent
						? `import { onRequest as userOnRequest } from ${JSON.stringify(resolvedMiddlewareId)};`
						: ''
				}
import { sequence } from ${JSON.stringify(SEQUENCE_MODULE)};
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
		importsRaw += `import { onRequest as ${name} } from ${JSON.stringify(normalizePath(entrypoint))};\n`;
		sequenceRaw += `${index > 0 ? ',' : ''}${name}`;
		index++;
	}

	return {
		importsCode: importsRaw,
		sequenceCode: sequenceRaw,
	};
}
