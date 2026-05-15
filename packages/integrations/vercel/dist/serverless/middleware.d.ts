import type { AstroIntegrationLogger } from 'astro';
/**
 * It generates the Vercel Edge Middleware file.
 *
 * It creates a temporary file, the edge middleware, with some dynamic info.
 *
 * Then this file gets bundled with esbuild. The bundle phase will inline the Astro middleware code.
 *
 * @param astroMiddlewareEntryPointPath
 * @param root
 * @param vercelEdgeMiddlewareHandlerPath
 * @param outPath
 * @param middlewareSecret
 * @param logger
 * @returns {Promise<URL>} The path to the bundled file
 */
export declare function generateEdgeMiddleware(
	astroMiddlewareEntryPointPath: URL,
	root: URL,
	vercelEdgeMiddlewareHandlerPath: URL,
	outPath: URL,
	middlewareSecret: string,
	logger: AstroIntegrationLogger,
): Promise<URL>;
