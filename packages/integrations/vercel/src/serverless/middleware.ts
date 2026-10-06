import { existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroIntegrationLogger } from 'astro';
import { rolldown } from 'rolldown';
import {
	ASTRO_LOCALS_HEADER,
	ASTRO_MIDDLEWARE_SECRET_HEADER,
	ASTRO_PATH_HEADER,
	ASTRO_PATH_PARAM,
	ASTRO_PATH_TOKEN_PARAM,
	NODE_PATH,
} from '../index.js';

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
		plugins: [
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
		await bundle.write({
			file: bundledFilePath,
			format: 'esm',
			minify: false,
		});
	} catch (err) {
		if ((err as Error).message.includes('Could not resolve "node:')) {
			logger.error(
				`Vercel does not allow the use of Node.js built-ins in edge functions. Please ensure your middleware code and 3rd-party packages don’t use Node built-ins.`,
			);
		}

		throw err;
	} finally {
		await bundle.close();
	}
	return pathToFileURL(bundledFilePath);
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
