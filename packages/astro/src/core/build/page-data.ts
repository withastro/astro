import type { AstroSettings, ManifestData } from '../../types/astro.js';
import type { Logger } from '../logger/core.js';
import type { AllPagesData } from './types.js';

import * as colors from 'kleur/colors';
import { debug } from '../logger/core.js';
import { makePageDataKey } from './plugins/util.js';
import { DEFAULT_COMPONENTS } from '../routing/default.js';

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
export function collectPagesData(opts: CollectPagesDataOptions): CollectPagesDataResult {
	const { settings, manifest } = opts;

	const assets: Record<string, string> = {};
	const allPages: AllPagesData = {};

	// Collect all routes ahead-of-time, before we start the build.
	// NOTE: This enforces that `getStaticPaths()` is only called once per route,
	// and is then cached across all future SSR builds. In the past, we've had trouble
	// with parallelized builds without guaranteeing that this is called first.

	let exit = false
	for (const route of manifest.routes) {
		// There's special handling in SSR
		for (const component of DEFAULT_COMPONENTS) {
			if (route.component === component) {
				exit = true
				break;
			}
		}
		if (exit) {
			exit = false
			continue;
		}
		// Generate a unique key to identify each page in the build process.
		const key = makePageDataKey(route.route, route.component);
		// static route:
		if (route.pathname) {
			allPages[key] = {
				key: key,
				component: route.component,
				route,
				moduleSpecifier: '',
				styles: [],
			};

			if (settings.buildOutput === 'static') {
				const html = `${route.pathname}`.replace(/\/?$/, '/index.html');
				debug(
					'build',
					`├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.yellow(html)}`,
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
		};
	}

	return { assets, allPages };
}
