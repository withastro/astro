import * as fs from 'node:fs';
import type * as vite from 'vite';
import type { AstroSettings } from '../types/astro.js';
import { notFoundTemplate } from '../template/4xx.js';
import { writeHtmlResponse } from './response.js';

// Vite internal prefixes that should always be allowed through
const VITE_INTERNAL_PREFIXES = [
	'/@vite/',
	'/@fs/',
	'/@id/',
	'/__vite',
	'/@react-refresh',
	'/node_modules/',
	'/.astro/',
];

/**
 * Outcome of the route guard evaluation for a dev-server request.
 *
 * - **`next`** — Allow the request through to downstream middleware.
 * - **`block`** — The file exists at the project root but outside srcDir/publicDir.
 *   Respond with a 404.
 */
export type RouteGuardDecision = { action: 'next' } | { action: 'block'; pathname: string };

/**
 * Filesystem query results needed by the route guard decision function.
 * Callers resolve these from the real filesystem; tests can provide them directly.
 */
export interface RouteGuardFsInfo {
	/** Whether the resolved pathname exists inside the project's `publicDir` (e.g. `public/robots.txt`). */
	existsInPublic: boolean;
	/** Whether the resolved pathname exists inside the project's `srcDir` (e.g. `src/pages/index.astro`). */
	existsInSrc: boolean;
	/** Whether the resolved pathname exists at the project root as a **file** (not a directory). Directories are allowed through because they may share names with valid page routes. */
	existsAtRootAsFile: boolean;
}

/**
 * Pure decision function for the route guard middleware.
 *
 * Determines whether a request should be blocked (file exists at project root
 * but outside srcDir/publicDir) or allowed through. The filesystem lookups are
 * injected via `fsInfo` so this function remains pure and unit-testable.
 */
export function evaluateRouteGuard(
	url: string,
	acceptHeader: string,
	fsInfo: RouteGuardFsInfo,
): RouteGuardDecision {
	// Only intercept requests that look like browser navigation (HTML requests)
	if (!acceptHeader.includes('text/html')) {
		return { action: 'next' };
	}

	let pathname: string;
	try {
		pathname = decodeURI(new URL(url, 'http://localhost').pathname);
	} catch {
		// Malformed URI, let other middleware handle it
		return { action: 'next' };
	}

	// Always allow Vite internal paths through
	if (VITE_INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return { action: 'next' };
	}

	// Always allow requests with query params (Vite transform requests like ?url, ?raw)
	if (url.includes('?')) {
		return { action: 'next' };
	}

	// Allow if file exists in publicDir or srcDir
	if (fsInfo.existsInPublic || fsInfo.existsInSrc) {
		return { action: 'next' };
	}

	// Block files that exist at project root but not in srcDir or publicDir
	// Directories are allowed — they may share names with valid page routes
	if (fsInfo.existsAtRootAsFile) {
		return { action: 'block', pathname };
	}

	// File doesn't exist anywhere, let other middleware handle it
	return { action: 'next' };
}

/**
 * Middleware that prevents Vite from serving files that exist outside
 * of srcDir and publicDir when accessed via direct URL navigation.
 *
 * This fixes the issue where files like /README.md are served
 * when they exist at the project root but aren't part of Astro's routing.
 */
export function routeGuardMiddleware(settings: AstroSettings): vite.Connect.NextHandleFunction {
	const { config } = settings;

	return function devRouteGuard(req, res, next) {
		const url = req.url;
		if (!url) {
			return next();
		}

		const accept = req.headers.accept || '';

		let pathname: string;
		try {
			pathname = decodeURI(new URL(url, 'http://localhost').pathname);
		} catch {
			return next();
		}

		const fsInfo: RouteGuardFsInfo = {
			existsInPublic: fs.existsSync(new URL('.' + pathname, config.publicDir)),
			existsInSrc: fs.existsSync(new URL('.' + pathname, config.srcDir)),
			existsAtRootAsFile: false,
		};

		// Only check root filesystem for non-Vite, non-query, HTML requests
		// (the pure function handles the early returns for those cases)
		if (
			accept.includes('text/html') &&
			!url.includes('?') &&
			!VITE_INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))
		) {
			try {
				const stat = fs.statSync(new URL('.' + pathname, config.root));
				fsInfo.existsAtRootAsFile = stat.isFile();
			} catch {
				// Path doesn't exist
			}
		}

		const decision = evaluateRouteGuard(url, accept, fsInfo);

		switch (decision.action) {
			case 'block': {
				const html = notFoundTemplate(decision.pathname);
				return writeHtmlResponse(res, 404, html);
			}
			case 'next':
				return next();
		}
	};
}
