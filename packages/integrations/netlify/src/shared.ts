import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import type { AstroConfig, RouteData } from 'astro';
import fs from 'node:fs';

export async function createRedirects(
	config: AstroConfig,
	routeToDynamicTargetMap: Map<RouteData, string>,
	dir: URL
) {
	const _redirectsURL = new URL('./_redirects', dir);

	const _redirects = createRedirectsFromAstroRoutes({
		config,
		routeToDynamicTargetMap,
		dir,
	});
	const content = _redirects.print();

	// Always use appendFile() because the redirects file could already exist,
	// e.g. due to a `/public/_redirects` file that got copied to the output dir.
	// If the file does not exist yet, appendFile() automatically creates it.
	await fs.promises.appendFile(_redirectsURL, content, 'utf-8');
}
