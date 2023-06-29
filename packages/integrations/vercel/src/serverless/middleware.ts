import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import { join } from 'node:path';
import { ASTRO_LOCALS_HEADER, type CreateLocals } from './adapter.js';

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
	outPath: string,
	saveLocals?: CreateLocals
): Promise<URL> {
	const entryPointPathURLAsString = JSON.stringify(
		fileURLToPath(astroMiddlewareEntryPointPath).replace(/\\/g, '/')
	);
	const code = edgeMiddlewareTemplate(entryPointPathURLAsString, saveLocals);
	// https://vercel.com/docs/concepts/functions/edge-middleware#create-edge-middleware
	const bundledFilePath = join(outPath, 'middleware.mjs');
	await esbuild.build({
		stdin: {
			contents: code,
			resolveDir: process.cwd(),
		},
		target: 'es2020',
		platform: 'browser',
		// https://runtime-keys.proposal.wintercg.org/#edge-light
		conditions: ['edge-light', 'worker', 'browser'],
		external: ['astro/middleware'],
		outfile: bundledFilePath,
		allowOverwrite: true,
		format: 'esm',
		bundle: true,
		minify: false,
	});
	return pathToFileURL(bundledFilePath);
}

function edgeMiddlewareTemplate(middlewarePath: string, createLocals?: CreateLocals) {
	const localsFn = createLocals ? `(${createLocals})({request})` : '(() => {})({request})';
	return `
import { onRequest } from ${middlewarePath};
import { createContext, trySerializeLocals } from 'astro/middleware';
export default async function middleware(request) {
	const url = new URL(request.url);
	const ctx = createContext({ 
		request,
		params: {}
	});
	const next = async () => {	
		ctx.locals = ${localsFn};
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
