import type { AstroSettings, ManifestData } from '../../@types/astro.js';
import type { Logger } from '../logger/core.js';
import type { AllPagesData } from './types.js';

import * as colors from 'kleur/colors';
import { debug } from '../logger/core.js';
import { makePageDataKey } from './plugins/util.js';

export interface CollectPagesDataOptions {
	settings: AstroSettings;
	logger: Logger;
	manifest: ManifestData;
}

export interface CollectPagesDataResult {
	assets: Record<string, string>;
	allPages: AllPagesData;
}

// Examines the routes and returns a collection of information about each page.
export async function collectPagesData(
	opts: CollectPagesDataOptions
): Promise<CollectPagesDataResult> {
	const { settings, manifest } = opts;

	const assets: Record<string, string> = {};
	const allPages: AllPagesData = {};
	const builtPaths = new Set<string>();
	const dataCollectionLogTimeout = setInterval(() => {
		opts.logger.info('build', 'The data collection step may take longer for larger projects...');
		clearInterval(dataCollectionLogTimeout);
	}, 30000);

	// Collect all routes ahead-of-time, before we start the build.
	// NOTE: This enforces that `getStaticPaths()` is only called once per route,
	// and is then cached across all future SSR builds. In the past, we've had trouble
	// with parallelized builds without guaranteeing that this is called first.
	for (const route of manifest.routes) {
		// Generate a unique key to identify each page in the build process.
		const key = makePageDataKey(route.route, route.component);
		// static route:
		if (route.pathname) {
			const routeCollectionLogTimeout = setInterval(() => {
				opts.logger.info(
					'build',
					`${colors.bold(
						route.component
					)} is taking a bit longer to import. This is common for larger "Astro.glob(...)" or "import.meta.glob(...)" calls, for instance. Hang tight!`
				);
				clearInterval(routeCollectionLogTimeout);
			}, 10000);
			builtPaths.add(route.pathname);
			allPages[key] = {
				key: key,
				component: route.component,
				route,
				moduleSpecifier: '',
				styles: [],
				hoistedScript: undefined,
				hasSharedModules: false,
			};

			clearInterval(routeCollectionLogTimeout);
			if (settings.config.output === 'static') {
				const html = `${route.pathname}`.replace(/\/?$/, '/index.html');
				debug(
					'build',
					`├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.yellow(html)}`
				);
			} else {
				debug('build', `├── ${colors.bold(colors.green('✔'))} ${route.component}`);
			}
			continue;
		}
		// dynamic route:
		allPages[key] = {
			key: key,
			component: route.component,
			route,
			moduleSpecifier: '',
			styles: [],
			hoistedScript: undefined,
			hasSharedModules: false,
		};
	}

	clearInterval(dataCollectionLogTimeout);
	return { assets, allPages };
}
