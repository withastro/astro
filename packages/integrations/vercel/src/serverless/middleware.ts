import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import { join } from 'node:path';
import { writeFile } from '../lib/fs.js';

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
	astroMiddlewareEntryPoint: URL,
	outPath: string
): Promise<URL> {
	const filePath = fileURLToPath(astroMiddlewareEntryPoint);
	const code = edgeMiddlewareTemplate(filePath);
	console.log(code);
	// Temporary file, so `esbuild` can resolve it without too much trouble.
	// Using `stdin` option is not very optimal
	const middlewareEdgePath = join(outPath, 'middleware-temp.mjs');
	await writeFile(middlewareEdgePath, code);
	console.log(middlewareEdgePath);
	// https://vercel.com/docs/concepts/functions/edge-middleware#create-edge-middleware
	const bundledFilePath = join(outPath, 'middleware.mjs');
	console.log(bundledFilePath);
	await esbuild.build({
		target: 'es2020',
		platform: 'browser',
		// https://runtime-keys.proposal.wintercg.org/#edge-light
		conditions: ['edge-light', 'worker', 'browser'],
		external: ['astro/middleware'],
		entryPoints: [middlewareEdgePath],
		outfile: bundledFilePath,
		allowOverwrite: true,
		format: 'esm',
		bundle: true,
		minify: false,
	});
	return pathToFileURL(bundledFilePath);
}

function edgeMiddlewareTemplate(middlewarePath: string) {
	return `
import { onRequest } from "${middlewarePath}"
import { createAPIContext } from 'astro/middleware';
export default function middleware(request) {
\tconst url = new URL(request.url);
\tconst next = async () => {
\t\tconst response = await fetch(url);
\t\treturn response;
\t};

\tconst ctx = createAPIContext(request);

\treturn onRequest(ctx, next);
}`;
}
