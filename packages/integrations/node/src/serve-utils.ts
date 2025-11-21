import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { RouteData } from 'astro';
import { NodeApp } from 'astro/app/node';
import send from 'send';

/**
 * Safely create a Request object with proper error handling.
 * Returns null if Request creation fails.
 */
export function createRequestSafely(
	req: IncomingMessage,
	app: NodeApp,
): { request: Request; error: null } | { request: null; error: Error } {
	try {
		const request = NodeApp.createRequest(req, {
			allowedDomains: app.getAllowedDomains?.() ?? [],
		});
		return { request, error: null };
	} catch (err) {
		return { request: null, error: err instanceof Error ? err : new Error(String(err)) };
	}
}

/**
 * Handle errors that occur during Request creation.
 * Logs the error and sends a 500 response.
 */
export function handleRequestCreationError(
	req: IncomingMessage,
	res: ServerResponse,
	error: Error,
	app: NodeApp,
): void {
	const logger = app.getAdapterLogger();
	logger.error(`Could not render ${req.url}`);
	console.error(error);
	res.statusCode = 500;
	res.end('Internal Server Error');
}

/**
 * Attempt to serve a prerendered 500 error page.
 * Returns true if successful, false otherwise.
 */
export function tryServe500ErrorPage(
	req: IncomingMessage,
	res: ServerResponse,
	clientDir: string,
	app: NodeApp,
	error: Error,
): boolean {
	const logger = app.getAdapterLogger();
	const errorPagePath = path.join(clientDir, app.removeBase('/500.html'));
	
	try {
		if (fs.existsSync(errorPagePath)) {
			res.statusCode = 500;
			const errorStream = send(req, app.removeBase('/500.html'), {
				root: clientDir,
			});
			errorStream.pipe(res);
			logger.error(`Error in middleware for ${req.url}, serving prerendered error page`);
			console.error(error);
			return true;
		}
	} catch {
		// Fall through to return false
	}
	
	return false;
}

/**
 * Send a generic 500 Internal Server Error response.
 */
export function send500Response(
	req: IncomingMessage,
	res: ServerResponse,
	error: Error,
	app: NodeApp,
): void {
	const logger = app.getAdapterLogger();
	logger.error(`Could not render ${req.url}`);
	console.error(error);
	res.statusCode = 500;
	res.end('Internal Server Error');
}

/**
 * Set headers for a route from the headersMap.
 * This applies headers that were defined in the Astro config for specific routes.
 */
export function setRouteHeaders(
	res: ServerResponse,
	app: NodeApp,
	routeData: RouteData | undefined,
	urlPath: string,
): void {
	// Only set headers if we have the headersMap and the route is prerendered
	if (!app.headersMap || app.headersMap.length === 0 || !routeData?.prerender) {
		return;
	}

	const matchedRoute = app.headersMap.find((header) => header.pathname.includes(urlPath));
	if (matchedRoute) {
		for (const header of matchedRoute.headers) {
			res.setHeader(header.key, header.value);
		}
	}
}
