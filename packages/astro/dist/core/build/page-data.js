import colors from 'piccolore';
import { debug } from '../logger/core.js';
import { DEFAULT_COMPONENTS } from '../routing/default.js';
import { makePageDataKey } from './plugins/util.js';
function collectPagesData(opts) {
	const { settings, manifest } = opts;
	const assets = {};
	const allPages = {};
	for (const route of manifest.routes) {
		if (DEFAULT_COMPONENTS.some((component) => route.component === component)) {
			continue;
		}
		const key = makePageDataKey(route.route, route.component);
		if (route.pathname) {
			allPages[key] = {
				key,
				component: route.component,
				route,
				moduleSpecifier: '',
				styles: [],
			};
			if (settings.buildOutput === 'static') {
				const html = `${route.pathname}`.replace(/\/?$/, '/index.html');
				debug(
					'build',
					`\u251C\u2500\u2500 ${colors.bold(colors.green('\u2714'))} ${route.component} \u2192 ${colors.yellow(html)}`,
				);
			} else {
				debug(
					'build',
					`\u251C\u2500\u2500 ${colors.bold(colors.green('\u2714'))} ${route.component}`,
				);
			}
			continue;
		}
		allPages[key] = {
			key,
			component: route.component,
			route,
			moduleSpecifier: '',
			styles: [],
		};
	}
	return { assets, allPages };
}
export { collectPagesData };
