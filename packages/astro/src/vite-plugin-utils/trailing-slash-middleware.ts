import { bold } from 'kleur/colors';
import type { Connect } from 'vite';
import { cleanUrl } from './index.js';
import * as messages from '../core/messages.js';
import type { Logger } from '../core/logger/core.js';

const HAS_FILE_EXTENSION_REGEXP = /\.[^/]+$/;

export function trailingSlashMiddleware(
	trailingSlash: 'never' | 'always' | 'ignore',
	logger: Logger,
): Connect.NextHandleFunction {
	if (trailingSlash === 'ignore') {
		return (req, res, next) => {
			next();
		};
	}

	return (req, res, next) => {
		if (req.url == null) {
			return next();
		}

		const pathname = cleanUrl(req.url);
		if (pathname === '/') {
			return next();
		}

		const hasTrailingSlash = pathname.endsWith('/');

		if (trailingSlash === 'never' && hasTrailingSlash) {
			const correctUrl = pathname.slice(0, -1) + req.url.slice(pathname.length);
			logRedirect(logger, req, correctUrl);
			res.writeHead(301, { Location: correctUrl });
			res.end();
			return;
		}

		if (
			trailingSlash === 'always' &&
			!hasTrailingSlash &&
			!HAS_FILE_EXTENSION_REGEXP.test(pathname)
		) {
			const correctUrl = pathname + '/' + req.url.slice(pathname.length);
			logRedirect(logger, req, correctUrl);
			res.writeHead(301, { Location: correctUrl });
			res.end();
			return;
		}

		next();
	};
}

function logRedirect(logger: Logger, req: Connect.IncomingMessage, correctUrl: string) {
	logger.info(
		null,
		messages.req({
			url: req.url!, // `req.url` is already checked before calling this function
			method: req.method,
			statusCode: 301,
			redirectLocation: correctUrl,
		}),
	);

	// If referer is provided, we try to provide a helpful warning if the user is accessing a page
	// from an incorrect trailing slash. This prevents potentially reaching incorrect URLs in production
	// since some hosts are lenient with trailing slashes and could serve anyway (which it really shouldn't),
	// leading to more issues for users that shouldn't need fixing in the first place.
	const referrer = req.headers.referer;
	if (referrer && referrer.includes('://localhost')) {
		try {
			const referrerUrl = new URL(referrer);
			logger.warn(
				'router',
				`${bold(referrerUrl.pathname + referrerUrl.search)} has a link to ${bold(req.url!)}, but it redirected to ${bold(correctUrl)}. ` +
					`Some hosts may not redirect automatically, or worse, serve the page anyway, which can lead to issues with relative links ` +
					`on your page in production only. To prevent this, make sure the page links to ${bold(correctUrl)} directly instead.`,
			);
		} catch {
			// Ignore URL parse errors
		}
	}
}
