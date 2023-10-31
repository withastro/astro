import type { Plugin as VitePlugin } from 'vite';
import { getOutputDirectory } from '../../prerender/utils.js';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../constants.js';
import { addRollupInput } from '../build/add-rollup-input.js';
import type { BuildInternals } from '../build/internal.js';
import type { StaticBuildOptions } from '../build/types.js';
import type { AstroSettings } from '../../@types/astro.js';

export const MIDDLEWARE_MODULE_ID = '@astro-middleware';
const EMPTY_MIDDLEWARE = '\0empty-middleware';

export function vitePluginMiddleware(settings: AstroSettings): VitePlugin {
	let viteCommand: 'build' | 'serve' = 'serve';

	return {
		name: '@astro/plugin-middleware',

		config(opts, { command }) {
			viteCommand = command;
			return opts;
		},

		async resolveId(id) {
			if (id === MIDDLEWARE_MODULE_ID) {
				return MIDDLEWARE_MODULE_ID;
			}
			if (id === EMPTY_MIDDLEWARE) {
				return EMPTY_MIDDLEWARE;
			}
		},

		async load(id) {
			if (id === EMPTY_MIDDLEWARE) {
				return 'export const onRequest = undefined';
			} else if (id === MIDDLEWARE_MODULE_ID) {
				let resolvedMiddlewareId: string;
				const middlewareId = await this.resolve(
					`${decodeURI(settings.config.srcDir.pathname)}${MIDDLEWARE_PATH_SEGMENT_NAME}`
				);
				if (middlewareId) {
					resolvedMiddlewareId = middlewareId.id;
				} else {
					resolvedMiddlewareId = EMPTY_MIDDLEWARE;
				}

				// In the build, tell Vite to emit this file
				if(viteCommand === 'build') {
					this.emitFile({
						type: 'chunk',
						preserveSignature: 'strict',
						fileName: 'middleware.mjs',
						id,
					});
				}

				let preMiddleware = createMiddlewareImports(settings.middleware.pre, 'pre');
				let postMiddleware = createMiddlewareImports(settings.middleware.post, 'post');

				const source = `
import { onRequest as userOnRequest } from '${resolvedMiddlewareId}';
import { sequence } from 'astro:middleware';
${preMiddleware.raw}${postMiddleware.raw}

export const onRequest = sequence(
	${preMiddleware.imports.map(n => n.identifier).join(',')}${preMiddleware.imports.length ? ',' : ''}
	userOnRequest${postMiddleware.imports.length ? ',' : ''}
	${postMiddleware.imports.map(n => n.identifier).join(',')}
);
`.trim();

				return source;
			}
		},
	};
}

type MiddlewareImport = { identifier: string };

function createMiddlewareImports(entrypoints: string[], prefix: string): { raw: string; imports: MiddlewareImport[] } {
	let imports: MiddlewareImport[] = [];
	let raw = '';
	let index = 0;
	for(const entrypoint of entrypoints) {
		const name = `_${prefix}_${index}`;
		raw += `import { onRequest as ${name} } from '${entrypoint}';\n`;
		imports.push({
			identifier: name
		});
		index++;
	}

	return {
		raw,
		imports
	};
}

export function vitePluginMiddlewareBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals
): VitePlugin {
	return {
		name: '@astro/plugin-middleware-build',

		options(options) {
			return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
		},

		writeBundle(_, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				if (chunk.fileName === 'middleware.mjs') {
					const outputDirectory = getOutputDirectory(opts.settings.config);
					internals.middlewareEntryPoint = new URL(chunkName, outputDirectory);
				}
			}
		},
	};
}
