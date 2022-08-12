import type { RouteData } from 'astro';
import fs from 'fs';

export async function createRedirects(
	routes: RouteData[],
	dir: URL,
	entryFile: string,
	edge: boolean
) {
	const _redirectsURL = new URL('./_redirects', dir);
	const kind = edge ? 'edge-functions' : 'functions';

	// Create the redirects file that is used for routing.
	let _redirects = '';
	for (const route of routes) {
		if (route.pathname) {
			_redirects += `
  ${route.pathname}    /.netlify/${kind}/${entryFile}    200`;

			if (route.route === '/404') {
				_redirects += `
  /*    /.netlify/${kind}/${entryFile}    404`;
			}
		} else {
			const pattern =
				'/' + route.segments.map(([part]) => (part.dynamic ? '*' : part.content)).join('/');
			_redirects += `
  ${pattern}    /.netlify/${kind}/${entryFile}    200`;
		}
	}

	// Always use appendFile() because the redirects file could already exist,
	// e.g. due to a `/public/_redirects` file that got copied to the output dir.
	// If the file does not exist yet, appendFile() automatically creates it.
	await fs.promises.appendFile(_redirectsURL, _redirects, 'utf-8');
}
