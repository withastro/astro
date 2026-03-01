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

		// Only intercept requests that look like browser navigation (HTML requests)
		// Let all other requests through (JS modules, assets, Vite transforms, etc.)
		const accept = req.headers.accept || '';
		if (!accept.includes('text/html')) {
			return next();
		}

		let pathname: string;
		try {
			pathname = decodeURI(new URL(url, 'http://localhost').pathname);
		} catch {
			// Malformed URI, let other middleware handle it
			return next();
		}

		// Always allow Vite internal paths through
		if (VITE_INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
			return next();
		}

		// Always allow requests with query params (Vite transform requests like ?url, ?raw)
		if (url.includes('?')) {
			return next();
		}

		// Check if the file exists in publicDir - allow if so
		const publicFilePath = new URL('.' + pathname, config.publicDir);
		if (fs.existsSync(publicFilePath)) {
			return next();
		}

		// Check if the file exists in srcDir - allow if so (potential route)
		const srcFilePath = new URL('.' + pathname, config.srcDir);
		if (fs.existsSync(srcFilePath)) {
			return next();
		}

		// Check if the file exists at project root (outside srcDir/publicDir)
		const rootFilePath = new URL('.' + pathname, config.root);
		if (fs.existsSync(rootFilePath)) {
			// File exists at root but not in srcDir or publicDir - block it
			const html = notFoundTemplate(pathname);
			return writeHtmlResponse(res, 404, html);
		}

		// File doesn't exist anywhere, let other middleware handle it
		return next();
	};
}
