import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { ASTRO_LOCALS_HEADER } from './integration-functions.js';
import { DENO_SHIM } from './shared.js';

/**
 * It generates a Netlify edge function.
 *
 */
export async function generateEdgeMiddleware(
	astroMiddlewareEntryPointPath: URL,
	outPath: string,
	netlifyEdgeMiddlewareHandlerPath: URL
): Promise<URL> {
	const entryPointPathURLAsString = JSON.stringify(
		fileURLToPath(astroMiddlewareEntryPointPath).replace(/\\/g, '/')
	);

	const code = edgeMiddlewareTemplate(entryPointPathURLAsString, netlifyEdgeMiddlewareHandlerPath);
	const bundledFilePath = join(outPath, 'edgeMiddleware.mjs');
	const esbuild = await import('esbuild');
	await esbuild.build({
		stdin: {
			contents: code,
			resolveDir: process.cwd(),
		},
		target: 'es2020',
		platform: 'browser',
		external: ['astro/middleware'],
		outfile: bundledFilePath,
		allowOverwrite: true,
		format: 'esm',
		bundle: true,
		minify: false,
		banner: {
			js: DENO_SHIM,
		},
	});
	return pathToFileURL(bundledFilePath);
}

function edgeMiddlewareTemplate(middlewarePath: string, netlifyEdgeMiddlewareHandlerPath: URL) {
	const filePathEdgeMiddleware = fileURLToPath(netlifyEdgeMiddlewareHandlerPath);
	let handlerTemplateImport = '';
	let handlerTemplateCall = '{}';
	if (existsSync(filePathEdgeMiddleware + '.js') || existsSync(filePathEdgeMiddleware + '.ts')) {
		const stringified = JSON.stringify(filePathEdgeMiddleware.replace(/\\/g, '/'));
		handlerTemplateImport = `import handler from ${stringified}`;
		handlerTemplateCall = `handler({ request, context })`;
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
		const response = await fetch(url, {
			headers: {
				${JSON.stringify(ASTRO_LOCALS_HEADER)}: trySerializeLocals(ctx.locals)
			}
		});
		return response;
	};

	return onRequest(ctx, next);
}`;
}
