import type { Plugin as VitePlugin } from 'vite';
import { addRollupInput } from '../core/build/add-rollup-input.js';
import type { Logger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { RouteData } from '../types/public/index.js';

type AstroRoutePlugin = {
	settings: AstroSettings;
	logger: Logger;
	routeList: RouteData[];
};

const ASTRO_PLUGIN_ROUTE = 'astro:dev:route';
const ASTRO_PLUGIN_ROUTE_ID = '\0' + ASTRO_PLUGIN_ROUTE;

const REGISTERED_ROUTES = new Set<string>();

// Plugin used to fetch the route components as virtual module
export default function astroRoutePlugin({
	settings,
	logger,
	routeList,
}: AstroRoutePlugin): VitePlugin {
	return {
		name: 'astro:scanner',
		options(options) {
			const inputs = [];
			for (const route of routeList) {
				inputs.push(`${route.route}`);
				REGISTERED_ROUTES.add(route.route);
			}

			console.log(inputs);
			return addRollupInput(options, inputs);
		},
		async resolveId(id) {
			if (REGISTERED_ROUTES.has(id)) {
				// return ASTRO_PLUGIN_ROUTE_ID;
				const route = routeList.find((r) => r.route == id);
				if (route) {
					const fileUrl = new URL(route.component, settings.config.root);
					let result = await this.resolve(fileUrl.toString());
					return result;
				}
			}
		},

		// async load(id) {
		// 	if (REGISTERED_ROUTES.has(id)) {
		// 		const route = routeList.find((r) => r.route == id);
		// 		if (route) {
		// 			const fileUrl = new URL(route.component, settings.config.root);
		// 			let result = await this.resolve(fileUrl.toString());
		// 			console.log(result);
		// 			return result;
		// 		}
		// 	}
		// },

		hotUpdate(options) {
			const isPagesFile = options.file.startsWith(settings.config.srcDir.toString() + '/pages');
			if (!isPagesFile) {
				return;
			}
			switch (options.type) {
				case 'create': {
				}
				case 'delete': {
				}
				case 'update': {
				}
			}
		},
	};
}
