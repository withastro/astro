import nodePath from 'node:path';
import { isRemotePath, removeLeadingForwardSlash } from '@astrojs/internal-helpers/path';
const pathJoin = nodePath.posix.join;
const ROUTE_DYNAMIC_SPLIT = /\[(.+?\(.+?\)|.+?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;
function getParts(part, file) {
	const result = [];
	part.split(ROUTE_DYNAMIC_SPLIT).map((str, i) => {
		if (!str) return;
		const dynamic = i % 2 === 1;
		const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];
		if (!content || (dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content))) {
			throw new Error(`Invalid route ${file} \u2014 parameter name must match /^[a-zA-Z0-9_$]+$/`);
		}
		result.push({
			content,
			dynamic,
			spread: dynamic && ROUTE_SPREAD.test(content),
		});
	});
	return result;
}
function getMatchPattern(segments) {
	return segments
		.map((segment) => {
			return segment
				.map((part) => {
					if (part.spread) {
						const paramName = part.content.startsWith('...') ? part.content.slice(3) : part.content;
						return `:${paramName}*`;
					}
					if (part.dynamic) {
						return `:${part.content}`;
					}
					return part.content;
				})
				.join('');
		})
		.join('/');
}
function getMatchRegex(segments) {
	return segments
		.map((segment, segmentIndex) => {
			return segment.length === 1 && segment[0].spread
				? '(?:\\/(.*?))?'
				: // Omit leading slash if segment is a spread.
					// This is handled using a regex in Astro core.
					// To avoid complex data massaging, we handle in-place here.
					(segmentIndex === 0 ? '' : '/') +
						segment
							.map((part) => {
								if (part)
									return part.spread
										? '(.*?)'
										: part.dynamic
											? '([^/]+?)'
											: part.content
													.normalize()
													.replace(/\?/g, '%3F')
													.replace(/#/g, '%23')
													.replace(/%5B/g, '[')
													.replace(/%5D/g, ']')
													.replace(/[*+?^${}()|[\]\\]/g, '\\$&');
							})
							.join('');
		})
		.join('');
}
function getRedirectLocation(route, config) {
	if (route.redirectRoute) {
		const pattern = getMatchPattern(route.redirectRoute.segments);
		return pathJoin(config.base, pattern);
	}
	const destination =
		typeof route.redirect === 'object' ? route.redirect.destination : (route.redirect ?? '');
	if (isRemotePath(destination)) {
		return destination;
	}
	return pathJoin(config.base, destination);
}
function getRedirectStatus(route) {
	if (typeof route.redirect === 'object') {
		return route.redirect.status;
	}
	return 301;
}
function escapeRegex(content) {
	const segments = removeLeadingForwardSlash(content)
		.split(nodePath.posix.sep)
		.filter(Boolean)
		.map((s) => {
			return getParts(s, content);
		});
	return `^/${getMatchRegex(segments)}$`;
}
function getRedirects(routes, config) {
	const redirects = [];
	for (const route of routes) {
		if (route.type === 'redirect') {
			redirects.push({
				source: config.base + getMatchPattern(route.segments),
				destination: getRedirectLocation(route, config),
				statusCode: getRedirectStatus(route),
			});
		}
	}
	return redirects;
}
export { escapeRegex, getRedirects };
