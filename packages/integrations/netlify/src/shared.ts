import type { AstroConfig, RouteData } from 'astro';
import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import fs from 'node:fs';

export async function createRedirects(
	config: AstroConfig,
	routes: RouteData[],
	dir: URL,
	entryFile: string,
	type: 'functions' | 'edge-functions' | 'builders' | 'static'
) {
	const kind = type ?? 'functions';
	const dynamicTarget = `/.netlify/${kind}/${entryFile}`;
	const _redirectsURL = new URL('./_redirects', dir);

	const _redirects = createRedirectsFromAstroRoutes({
		config, routes, dir, dynamicTarget
	});
	const content = _redirects.print();

	// Always use appendFile() because the redirects file could already exist,
	// e.g. due to a `/public/_redirects` file that got copied to the output dir.
	// If the file does not exist yet, appendFile() automatically creates it.
	await fs.promises.appendFile(_redirectsURL, content, 'utf-8');
}
