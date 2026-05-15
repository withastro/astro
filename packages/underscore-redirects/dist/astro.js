import { posix } from 'node:path';
import { HostRoutes } from './host-route.js';
const pathJoin = posix.join;
function getRedirectStatus(route) {
	if (typeof route.redirect === 'object') {
		return route.redirect.status;
	}
	return 301;
}
function getTrailingSlashPaths(inputPath, trailingSlash) {
	if (inputPath === '/') {
		return ['/'];
	}
	const hasTrailingSlash = inputPath.endsWith('/');
	const withoutSlash = hasTrailingSlash ? inputPath.slice(0, -1) : inputPath;
	const withSlash = hasTrailingSlash ? inputPath : inputPath + '/';
	switch (trailingSlash) {
		case 'always':
			return [withSlash];
		case 'never':
			return [withoutSlash];
		case 'ignore':
		default:
			return [withoutSlash, withSlash];
	}
}
function createRedirectsFromAstroRoutes({
	config,
	routeToDynamicTargetMap,
	dir,
	buildOutput,
	assets,
}) {
	const base =
		config.base && config.base !== '/'
			? config.base.endsWith('/')
				? config.base.slice(0, -1)
				: config.base
			: '';
	const redirects = new HostRoutes();
	for (const [route, dynamicTarget = ''] of routeToDynamicTargetMap) {
		const distURL = assets?.get(route.pattern);
		if (route.pathname) {
			if (route.redirect) {
				const inputPath =
					route.type === 'redirect' && route.entrypoint ? route.entrypoint : route.pathname;
				const trailingSlash = config.trailingSlash ?? 'ignore';
				const paths = getTrailingSlashPaths(inputPath, trailingSlash);
				for (const path of paths) {
					redirects.add({
						dynamic: false,
						input: `${base}${path}`,
						target:
							typeof route.redirect === 'object' ? route.redirect.destination : route.redirect,
						status: getRedirectStatus(route),
						weight: 2,
					});
				}
				continue;
			}
			if (buildOutput === 'static') {
				continue;
			}
			if (distURL) {
				redirects.add({
					dynamic: false,
					input: `${base}${route.pathname}`,
					target: prependForwardSlash(distURL.toString().replace(dir.toString(), '')),
					status: 200,
					weight: 2,
				});
			} else {
				redirects.add({
					dynamic: false,
					input: `${base}${route.pathname}`,
					target: dynamicTarget,
					status: 200,
					weight: 2,
				});
				if (route.pattern === '/404') {
					redirects.add({
						dynamic: true,
						input: '/*',
						target: dynamicTarget,
						status: 404,
						weight: 0,
					});
				}
			}
		} else {
			const pattern = generateDynamicPattern(route);
			if (distURL) {
				const targetRoute = route.redirectRoute ?? route;
				let target = generateDynamicPattern(targetRoute);
				if (config.build.format === 'directory') {
					target = pathJoin(target, 'index.html');
				} else {
					target += '.html';
				}
				redirects.add({
					dynamic: true,
					input: `${base}${pattern}`,
					target,
					status: route.type === 'redirect' ? 301 : 200,
					weight: 1,
				});
			} else {
				redirects.add({
					dynamic: true,
					input: `${base}${pattern}`,
					target: dynamicTarget,
					status: 200,
					weight: 1,
				});
			}
		}
	}
	return redirects;
}
function generateDynamicPattern(route) {
	return (
		'/' +
		route.segments
			.map(([part]) => {
				if (part.dynamic) {
					if (part.spread) {
						return '*';
					} else {
						return ':' + part.content;
					}
				} else {
					return part.content;
				}
			})
			.join('/')
	);
}
function prependForwardSlash(str) {
	return str.startsWith('/') ? str : '/' + str;
}
function createHostedRouteDefinition(route, config) {
	const base =
		config.base && config.base !== '/'
			? config.base.endsWith('/')
				? config.base.slice(0, -1)
				: config.base
			: '';
	if (route.pattern === '/404') {
		return {
			dynamic: true,
			input: '/*',
			status: 404,
		};
	}
	if (route.pathname) {
		return {
			input: `${base}${route.pathname}`,
			status: 200,
			dynamic: false,
		};
	} else {
		const pattern = generateDynamicPattern(route);
		return {
			dynamic: true,
			input: `${base}${pattern}`,
			status: 200,
		};
	}
}
export { createHostedRouteDefinition, createRedirectsFromAstroRoutes, getTrailingSlashPaths };
