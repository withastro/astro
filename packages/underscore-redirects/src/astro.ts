import type { AstroConfig, RouteData, ValidRedirectStatus } from 'astro';
import { Redirects } from './redirects.js';
import { posix } from 'node:path';

const pathJoin = posix.join;

function getRedirectStatus(route: RouteData): ValidRedirectStatus {
	if(typeof route.redirect === 'object') {
		return route.redirect.status;
	}
	return 301;
}

export function createRedirectsFromAstroRoutes(
	config: Pick<AstroConfig, 'output' | 'build'>,
	routes: RouteData[],
	dir: URL,
	dynamicTargetValue: string
) {
	const output = config.output;
	const _redirects = new Redirects();

	for (const route of routes) {
		if (route.pathname) {
			if(route.redirect) {
				_redirects.add({
					dynamic: false,
					input: route.pathname,
					target: typeof route.redirect === 'object' ? route.redirect.destination : route.redirect,
					status: getRedirectStatus(route),
					weight: 2
				});
				continue;
			}

			if(output === 'static') {
				continue;
			}

			else if (route.distURL) {
				_redirects.add({
					dynamic: false,
					input: route.pathname,
					target: prependForwardSlash(route.distURL.toString().replace(dir.toString(), '')),
					status: 200,
					weight: 2,
				});
			} else {
				_redirects.add({
					dynamic: false,
					input: route.pathname,
					target: dynamicTargetValue,
					status: 200,
					weight: 2,
				});

				if (route.route === '/404') {
					_redirects.add({
						dynamic: true,
						input: '/*',
						target: dynamicTargetValue,
						status: 404,
						weight: 0,
					});
				}
			}
		} else {
			const pattern = generateDynamicPattern(route);

			if (route.distURL) {
				const targetRoute = route.redirectRoute ?? route;
				const targetPattern = generateDynamicPattern(targetRoute);
				let target = targetPattern;
				if(config.build.format === 'directory') {
					target = pathJoin(target, 'index.html');
				} else {
					target += '.html';
				}
				_redirects.add({
					dynamic: true,
					input: pattern,
					target,
					status: route.type === 'redirect' ? 301 : 200,
					weight: 1,
				});
			} else {
				_redirects.add({
					dynamic: true,
					input: pattern,
					target: dynamicTargetValue,
					status: 200,
					weight: 1,
				});
			}
		}
	}

	return _redirects;
}

function generateDynamicPattern(route: RouteData) {
	const pattern =
		'/' +
		route.segments
			.map(([part]) => {
				//(part.dynamic ? '*' : part.content)
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
			.join('/');
	return pattern;
}

function prependForwardSlash(str: string) {
	return str[0] === '/' ? str : '/' + str;
}
