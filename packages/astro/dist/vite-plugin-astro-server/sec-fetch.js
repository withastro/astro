import { BaseApp } from '../core/app/base.js';
function secFetchMiddleware(logger, allowedDomains) {
	return function devSecFetch(req, res, next) {
		const secFetchSite = req.headers['sec-fetch-site'];
		const secFetchMode = req.headers['sec-fetch-mode'];
		if (!secFetchSite) {
			return next();
		}
		if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
			return next();
		}
		if (secFetchMode === 'navigate' || secFetchMode === 'nested-navigate') {
			return next();
		}
		if (secFetchMode === 'websocket') {
			return next();
		}
		const origin = req.headers['origin'];
		if (typeof origin === 'string') {
			try {
				const originUrl = new URL(origin);
				const protocol = originUrl.protocol.slice(0, -1);
				if (BaseApp.validateForwardedHost(originUrl.host, allowedDomains, protocol)) {
					return next();
				}
			} catch {}
		}
		logger.warn(
			'router',
			`Blocked cross-origin request to ${req.url} (Sec-Fetch-Site: ${secFetchSite}, Sec-Fetch-Mode: ${secFetchMode}). Cross-origin subresource requests are not allowed on the dev server for security reasons.`,
		);
		res.statusCode = 403;
		res.setHeader('Content-Type', 'text/plain');
		res.end('Cross-origin request blocked');
	};
}
export { secFetchMiddleware };
