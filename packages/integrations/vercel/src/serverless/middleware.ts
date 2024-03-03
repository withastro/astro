import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { builtinModules } from 'node:module';
import {
	ASTRO_MIDDLEWARE_SECRET_HEADER,
	ASTRO_LOCALS_HEADER,
	ASTRO_PATH_HEADER,
	NODE_PATH,
} from './adapter.js';

/**
 * It generates the Vercel Edge Middleware file.
 *
 * It creates a temporary file, the edge middleware, with some dynamic info.
 *
 * Then this file gets bundled with esbuild. The bundle phase will inline the Astro middleware code.
 *
 * @param astroMiddlewareEntryPoint
 * @param outPath
 * @returns {Promise<URL>} The path to the bundled file
 */
export async function generateEdgeMiddleware(
	astroMiddlewareEntryPointPath: URL,
	vercelEdgeMiddlewareHandlerPath: URL,
	outPath: URL,
	middlewareSecret: string
): Promise<URL> {
	const code = edgeMiddlewareTemplate(
		astroMiddlewareEntryPointPath,
		vercelEdgeMiddlewareHandlerPath,
		middlewareSecret
	);
	// https://vercel.com/docs/concepts/functions/edge-middleware#create-edge-middleware
	const bundledFilePath = fileURLToPath(outPath);
	const esbuild = await import('esbuild');
	await esbuild.build({
		stdin: {
			contents: code,
			resolveDir: process.cwd(),
		},
		target: 'es2020',
		platform: 'browser',
		// https://runtime-keys.proposal.wintercg.org/#edge-light
		conditions: ['edge-light', 'worker', 'browser'],
		outfile: bundledFilePath,
		allowOverwrite: true,
		format: 'esm',
		bundle: true,
		minify: false,
		// ensure node built-in modules are namespaced with `node:`
		plugins: [
			{
				name: 'esbuild-namespace-node-built-in-modules',
				setup(build) {
					const filter = new RegExp(builtinModules.map((mod) => `(^${mod}$)`).join('|'));
					build.onResolve({ filter }, (args) => ({ path: 'node:' + args.path, external: true }));
				},
			},
		],
	});
	return pathToFileURL(bundledFilePath);
}

function edgeMiddlewareTemplate(
	astroMiddlewareEntryPointPath: URL,
	vercelEdgeMiddlewareHandlerPath: URL,
	middlewareSecret: string
) {
	const middlewarePath = JSON.stringify(
		fileURLToPath(astroMiddlewareEntryPointPath).replace(/\\/g, '/')
	);
	const filePathEdgeMiddleware = fileURLToPath(vercelEdgeMiddlewareHandlerPath);
	let handlerTemplateImport = '';
	let handlerTemplateCall = '{}';
	if (existsSync(filePathEdgeMiddleware + '.js') || existsSync(filePathEdgeMiddleware + '.ts')) {
		const stringified = JSON.stringify(filePathEdgeMiddleware.replace(/\\/g, '/'));
		handlerTemplateImport = `import handler from ${stringified}`;
		handlerTemplateCall = `await handler({ request, context })`;
	} else {
	}
	return `
	${handlerTemplateImport}
import { onRequest } from ${middlewarePath};
import { createContext, trySerializeLocals } from 'astro/middleware';
export default async function middleware(request, context) {
	const ctx = createContext({
		request,
		params: {}
	});
	ctx.locals = ${handlerTemplateCall};
	const { origin } = new URL(request.url);
	const next = () =>
		fetch(new URL('/${NODE_PATH}', request.url), {
			headers: {
				...Object.fromEntries(request.headers.entries()),
				'${ASTRO_MIDDLEWARE_SECRET_HEADER}': '${middlewareSecret}',
				'${ASTRO_PATH_HEADER}': request.url.replace(origin, ''),
				'${ASTRO_LOCALS_HEADER}': trySerializeLocals(ctx.locals)
			}
		})

	return onRequest(ctx, next);
}`;
}
