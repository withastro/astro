import * as fs from 'node:fs';
import { notFoundTemplate } from '../template/4xx.js';
import { writeHtmlResponse } from './response.js';
const VITE_INTERNAL_PREFIXES = [
	'/@vite/',
	'/@fs/',
	'/@id/',
	'/__vite',
	'/@react-refresh',
	'/node_modules/',
	'/.astro/',
];
function evaluateRouteGuard(url, acceptHeader, fsInfo) {
	if (!acceptHeader.includes('text/html')) {
		return { action: 'next' };
	}
	let pathname;
	try {
		pathname = decodeURI(new URL(url, 'http://localhost').pathname);
	} catch {
		return { action: 'next' };
	}
	if (VITE_INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return { action: 'next' };
	}
	if (url.includes('?')) {
		return { action: 'next' };
	}
	if (fsInfo.existsInPublic || fsInfo.existsInSrc) {
		return { action: 'next' };
	}
	if (fsInfo.existsAtRootAsFile) {
		return { action: 'block', pathname };
	}
	return { action: 'next' };
}
function routeGuardMiddleware(settings) {
	const { config } = settings;
	return function devRouteGuard(req, res, next) {
		const url = req.url;
		if (!url) {
			return next();
		}
		const accept = req.headers.accept || '';
		let pathname;
		try {
			pathname = decodeURI(new URL(url, 'http://localhost').pathname);
		} catch {
			return next();
		}
		const fsInfo = {
			existsInPublic: fs.existsSync(new URL('.' + pathname, config.publicDir)),
			existsInSrc: fs.existsSync(new URL('.' + pathname, config.srcDir)),
			existsAtRootAsFile: false,
		};
		if (
			accept.includes('text/html') &&
			!url.includes('?') &&
			!VITE_INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))
		) {
			try {
				const stat = fs.statSync(new URL('.' + pathname, config.root));
				fsInfo.existsAtRootAsFile = stat.isFile();
			} catch {}
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
export { evaluateRouteGuard, routeGuardMiddleware };
