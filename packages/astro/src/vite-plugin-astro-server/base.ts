import * as fs from 'node:fs';
import path from 'node:path';
import { appendForwardSlash, prependForwardSlash } from '@astrojs/internal-helpers/path';
import colors from 'piccolore';
import type * as vite from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import { notFoundTemplate, subpathNotUsedTemplate } from '../template/4xx.js';
import type { AstroSettings } from '../types/astro.js';
import { writeHtmlResponse } from './response.js';

/**
 * Outcome of the base-URL evaluation for a dev-server request.
 *
 * - **`rewrite`** — The request URL starts with the configured `base` path.
 *   Strip the base prefix so downstream handlers see a root-relative URL
 *   (e.g. `/docs/about` → `/about` when `base: '/docs'`).
 * - **`not-found-subpath`** — The user navigated to `/` or `/index.html` but
 *   the project has a non-root `base`. Respond with a 404 explaining that the
 *   site lives under the base path, so the developer knows to update the URL.
 * - **`not-found`** — The URL doesn't start with the base and the browser
 *   expects HTML (`Accept: text/html`). Respond with a generic 404 page.
 * - **`check-public`** — The URL doesn't match the base and the browser is
 *   requesting a non-HTML asset (image, script, font, etc.). The middleware
 *   must do an async `fs.stat` to decide whether the file exists in
 *   `publicDir` (and show a helpful base-path hint) or just pass through.
 *   This variant cannot be resolved purely.
 */
export type BaseRewriteDecision =
	| { action: 'rewrite'; newUrl: string }
	| { action: 'not-found-subpath'; pathname: string; devRoot: string }
	| { action: 'not-found'; pathname: string }
	| { action: 'check-public' };

/**
 * Computes the `devRoot` path used to match and strip the base prefix.
 *
 * The `devRoot` is the pathname portion of the base URL (resolved against the
 * `site` if present, otherwise against `http://localhost`). For example:
 * - `base: '/docs'`, no site → `/docs`
 * - `base: '/docs'`, `site: 'https://example.com'` → `/docs`
 * - `base: '/'` → `/`
 */
export function resolveDevRoot(base: string, site?: string) {
	const effectiveBase = base || '/';
	const siteUrl = site ? new URL(effectiveBase, site) : undefined;
	const devRootURL = new URL(effectiveBase, 'http://localhost');
	const devRoot = siteUrl ? siteUrl.pathname : devRootURL.pathname;
	const devRootReplacement = devRoot.endsWith('/') ? '/' : '';
	return { devRoot, devRootReplacement };
}

/**
 * Pure decision function for base-URL dev-server rewriting.
 *
 * Evaluates whether the incoming `url` starts with the project's `base` path
 * and returns the action the middleware should take. The async `fs.stat` branch
 * (checking `publicDir`) is represented as `check-public` and must be handled
 * by the caller.
 */
export function evaluateBaseRewrite(
	url: string,
	pathname: string,
	acceptHeader: string | undefined,
	devRoot: string,
	devRootReplacement: string,
): BaseRewriteDecision {
	if (pathname.startsWith(devRoot)) {
		let newUrl = url.replace(devRoot, devRootReplacement);
		if (!newUrl.startsWith('/')) newUrl = prependForwardSlash(newUrl);
		return { action: 'rewrite', newUrl };
	}

	if (pathname === '/' || pathname === '/index.html') {
		return { action: 'not-found-subpath', pathname, devRoot };
	}

	if (acceptHeader?.includes('text/html')) {
		return { action: 'not-found', pathname };
	}

	return { action: 'check-public' };
}

export function baseMiddleware(
	settings: AstroSettings,
	logger: AstroLogger,
): vite.Connect.NextHandleFunction {
	const { config } = settings;
	const { devRoot, devRootReplacement } = resolveDevRoot(config.base, config.site);

	return function devBaseMiddleware(req, res, next) {
		const url = req.url!;
		let pathname: string;
		try {
			pathname = decodeURI(new URL(url, 'http://localhost').pathname);
		} catch (e) {
			/* malformed uri */
			return next(e);
		}

		const decision = evaluateBaseRewrite(
			url,
			pathname,
			req.headers.accept,
			devRoot,
			devRootReplacement,
		);

		switch (decision.action) {
			case 'rewrite':
				req.url = decision.newUrl;
				return next();
			case 'not-found-subpath': {
				const html = subpathNotUsedTemplate(decision.devRoot, decision.pathname);
				return writeHtmlResponse(res, 404, html);
			}
			case 'not-found': {
				const html = notFoundTemplate(decision.pathname);
				return writeHtmlResponse(res, 404, html);
			}
			case 'check-public': {
				const publicPath = new URL('.' + req.url, config.publicDir);
				fs.stat(publicPath, (_err, stats) => {
					if (stats) {
						const publicDir = appendForwardSlash(
							path.posix.relative(config.root.pathname, config.publicDir.pathname),
						);
						const devRootURL = new URL(devRoot, 'http://localhost');
						const expectedLocation = new URL(devRootURL.pathname + url, devRootURL).pathname;

						logger.error(
							'router',
							`Request URLs for ${colors.bold(
								publicDir,
							)} assets must also include your base. "${expectedLocation}" expected, but received "${url}".`,
						);
						const html = subpathNotUsedTemplate(devRoot, pathname);
						return writeHtmlResponse(res, 404, html);
					} else {
						next();
					}
				});
			}
		}
	};
}
