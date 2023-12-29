import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ASTRO_LOCALS_HEADER } from './adapter.js';

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
): Promise<URL> {
	const code = edgeMiddlewareTemplate(astroMiddlewareEntryPointPath, vercelEdgeMiddlewareHandlerPath);
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
	});
	return pathToFileURL(bundledFilePath);
}

function edgeMiddlewareTemplate(astroMiddlewareEntryPointPath: URL, vercelEdgeMiddlewareHandlerPath: URL) {
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
	const url = new URL(request.url);
	const ctx = createContext({
		request,
		params: {}
	});
	ctx.locals = ${handlerTemplateCall};
	const next = async () => {
		return new Response(null, {
			headers: {
				'x-middleware-next': '1',
				'x-astro-locals': trySerializeLocals(ctx.locals)
			}
		})
	};

	return onRequest(ctx, next);
}`;
}
