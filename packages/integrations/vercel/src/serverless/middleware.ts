import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroIntegrationLogger } from 'astro';
import {
	ASTRO_LOCALS_HEADER,
	ASTRO_MIDDLEWARE_SECRET_HEADER,
	ASTRO_PATH_HEADER,
	ASTRO_PATH_PARAM,
	ASTRO_PATH_TOKEN_PARAM,
	NODE_PATH,
} from './constants.js';

const RUNTIME_NODE_MODULE_SHIM_ID = '\0vercel:runtime-node-module-shim';

export interface IsrForwarding {
	/** Route patterns backed by the ISR function. */
	isrRoutes: string[];
	/** Route patterns `isr.exclude` keeps out of the cache; checked first. */
	isrExcludedRoutes: string[];
}

/**
 * It generates the Vercel Edge Middleware file.
 *
 * It creates a temporary file, the edge middleware, with some dynamic info.
 *
 * Then this file gets bundled with rolldown. The bundle phase will inline the Astro middleware code.
 *
 * @param astroMiddlewareEntryPointPath
 * @param root
 * @param vercelEdgeMiddlewareHandlerPath
 * @param outPath
 * @param middlewareSecret
 * @param logger
 * @param isrForwarding Route patterns the generated `next()` forwards to `_isr`, if any
 * @returns {Promise<URL>} The path to the bundled file
 */
export async function generateEdgeMiddleware(
	astroMiddlewareEntryPointPath: URL,
	root: URL,
	vercelEdgeMiddlewareHandlerPath: URL,
	outPath: URL,
	middlewareSecret: string,
	logger: AstroIntegrationLogger,
	isrForwarding?: IsrForwarding,
): Promise<URL> {
	const code = edgeMiddlewareTemplate(
		astroMiddlewareEntryPointPath,
		vercelEdgeMiddlewareHandlerPath,
		middlewareSecret,
		logger,
		isrForwarding,
	);
	// https://vercel.com/docs/concepts/functions/edge-middleware#create-edge-middleware
	const bundledFilePath = fileURLToPath(outPath);
	const virtualEntryId = fileURLToPath(new URL('__vercel_edge_middleware__.js', root));
	const nodeBuiltinImports = new Set<string>();
	// Loaded lazily so that importing the integration entry (`../index.js`) does not load
	// rolldown's native binding, which is not available inside deployed functions.
	const { rolldown } = await import('rolldown');
	const bundle = await rolldown({
		input: virtualEntryId,
		cwd: fileURLToPath(root),
		platform: 'browser',
		resolve: {
			// Rolldown conditions take priority over the platform defaults.
			// https://runtime-keys.proposal.wintercg.org/#edge-light
			conditionNames: ['edge-light', 'workerd', 'worker', 'browser', 'import', 'default'],
		},
		transform: {
			// Vercel Edge runtime targets ESNext, because Cloudflare Workers update v8 weekly
			// https://github.com/vercel/vercel/blob/1006f2ae9d67ea4b3cbb1073e79d14d063d42436/packages/next/scripts/build-edge-function-template.js
			target: 'esnext',
		},
		// Rolldown reports unresolved imports as warnings and keeps them external,
		// so collect Node.js built-ins from the logs to fail with a helpful hint.
		onLog(level, log, defaultHandler) {
			if (log.code === 'UNRESOLVED_IMPORT' && log.exporter && isNodeBuiltin(log.exporter)) {
				nodeBuiltinImports.add(log.exporter);
				return;
			}
			defaultHandler(level, log);
		},
		plugins: [
			{
				// Server chunks import Rolldown's runtime chunk, which imports `node:module` for its
				// `__require` helper whenever a server dependency calls `require()` (sharp does). The
				// helper is `/* #__PURE__ */`, so it is tree-shaken from the edge bundle unless the
				// middleware calls it; the shim only lets it resolve. A shim that survives into the
				// output is reported as a Node.js built-in below.
				name: 'vercel:rolldown-runtime-node-module',
				async resolveId(source, importer) {
					if (source !== 'node:module' || !importer) return;
					if (!onlyRolldownRuntimeUsesNodeModule(await readFile(importer, 'utf-8'))) return;
					return { id: RUNTIME_NODE_MODULE_SHIM_ID, moduleSideEffects: false };
				},
				load(id) {
					if (id === RUNTIME_NODE_MODULE_SHIM_ID) {
						return `export function createRequire() { throw new Error('require() is not available in Vercel edge functions.'); }`;
					}
				},
			},
			{
				name: 'vercel:edge-middleware',
				resolveId(source) {
					if (source === virtualEntryId) {
						return virtualEntryId;
					}
				},
				load(source) {
					if (source === virtualEntryId) {
						return code;
					}
				},
			},
			{
				name: 'rolldown-namespace-node-built-in-modules',
				resolveId(source) {
					if (builtinModules.includes(source)) {
						// Ensure node built-in modules are namespaced with `node:`.
						return { id: `node:${source}`, external: true };
					}
				},
			},
		],
	});

	try {
		const { output } = await bundle.write({
			file: bundledFilePath,
			format: 'esm',
			minify: false,
		});
		if (
			output.some(
				(chunk) => chunk.type === 'chunk' && chunk.moduleIds.includes(RUNTIME_NODE_MODULE_SHIM_ID),
			)
		) {
			nodeBuiltinImports.add('node:module');
		}
	} finally {
		await bundle.close();
	}

	if (nodeBuiltinImports.size > 0) {
		logger.error(
			`Vercel does not allow the use of Node.js built-ins in edge functions. Please ensure your middleware code and 3rd-party packages don’t use Node built-ins.`,
		);
		throw new Error(
			`Vercel does not allow the use of Node.js built-ins in edge functions: ${[...nodeBuiltinImports].join(', ')}.`,
		);
	}

	return pathToFileURL(bundledFilePath);
}

/**
 * Whether the only use of `node:module` in `code` is the `createRequire` call of Rolldown's
 * `__require` runtime helper.
 */
function onlyRolldownRuntimeUsesNodeModule(code: string): boolean {
	return (
		code.match(/from ["']node:module["']/g)?.length === 1 &&
		/^import \{ createRequire \} from "node:module";$/m.test(code) &&
		code.match(/\bcreateRequire\b/g)?.length === 2 &&
		code.includes('var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();')
	);
}

/**
 * Whether `id` is a Node.js built-in, with or without the `node:` prefix.
 */
function isNodeBuiltin(id: string): boolean {
	const name = id.startsWith('node:') ? id.slice('node:'.length) : id;
	return builtinModules.includes(name);
}

function edgeMiddlewareTemplate(
	astroMiddlewareEntryPointPath: URL,
	vercelEdgeMiddlewareHandlerPath: URL,
	middlewareSecret: string,
	logger: AstroIntegrationLogger,
	isrForwarding?: IsrForwarding,
) {
	const middlewarePath = JSON.stringify(
		fileURLToPath(astroMiddlewareEntryPointPath).replace(/\\/g, '/'),
	);
	const filePathEdgeMiddleware = fileURLToPath(vercelEdgeMiddlewareHandlerPath);
	let handlerTemplateImport = '';
	let handlerTemplateCall = '{}';
	if (existsSync(filePathEdgeMiddleware + '.js') || existsSync(filePathEdgeMiddleware + '.ts')) {
		logger.warn(
			'Usage of `vercel-edge-middleware.js` is deprecated. You can now use the `waitUntil(promise)` function directly as `ctx.locals.waitUntil(promise)`.',
		);
		const stringified = JSON.stringify(filePathEdgeMiddleware.replace(/\\/g, '/'));
		handlerTemplateImport = `import handler from ${stringified}`;
		handlerTemplateCall = `await handler({ request, context })`;
	} else {
	}
	return `
	${handlerTemplateImport}
import { onRequest } from ${middlewarePath};
import { createContext, trySerializeLocals } from 'astro/middleware';

const isrRoutes = ${JSON.stringify(isrForwarding?.isrRoutes ?? [])}.map((source) => new RegExp(source));
const isrExcludedRoutes = ${JSON.stringify(isrForwarding?.isrExcludedRoutes ?? [])}.map(
	(source) => new RegExp(source),
);

const isCached = (pathname) =>
	!isrExcludedRoutes.some((route) => route.test(pathname)) &&
	isrRoutes.some((route) => route.test(pathname));

// Cached routes go back through \`_isr\`, or every request would re-render.
// Keep in step with \`getIsrPath\`.
function forwardPath(pathname) {
	if (!isCached(pathname)) return '/${NODE_PATH}';
	const params = new URLSearchParams({
		'${ASTRO_PATH_PARAM}': pathname,
		'${ASTRO_PATH_TOKEN_PARAM}': '${middlewareSecret}',
	});
	return '/_isr?' + params.toString();
}

export default async function middleware(request, context) {
	const ctx = createContext({
		request,
		params: {},
		clientAddress: request.headers.get('x-real-ip') || undefined,
	});
	Object.assign(ctx.locals, { vercel: { edge: context }, ...${handlerTemplateCall} });
	const { origin, pathname } = new URL(request.url);
	const next = async () => {
		const { vercel, ...locals } = ctx.locals;
		const response = await fetch(new URL(forwardPath(pathname), request.url), {
			method: request.method,
			headers: {
				...Object.fromEntries(request.headers.entries()),
				'${ASTRO_MIDDLEWARE_SECRET_HEADER}': '${middlewareSecret}',
				'${ASTRO_PATH_HEADER}': request.url.replace(origin, ''),
				'${ASTRO_LOCALS_HEADER}': trySerializeLocals(locals)
			},
			...(request.body ? { body: request.body, duplex: 'half' } : {}),
		});
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	};

	const response = await onRequest(ctx, next);
	// Append cookies from Astro.cookies
	for(const setCookieHeaderValue of ctx.cookies.headers()) {
		response.headers.append('set-cookie', setCookieHeaderValue);
	}
	return response;
}`;
}
