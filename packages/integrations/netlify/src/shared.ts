import type { AstroConfig, RouteData } from 'astro';
import fs from 'fs';

type RedirectDefinition = {
	dynamic: boolean;
	input: string;
	target: string;
	weight: 0 | 1;
	status: 200 | 404;
};

export async function createRedirects(
	config: AstroConfig,
	routes: RouteData[],
	dir: URL,
	entryFile: string,
	type: 'functions' | 'edge-functions' | 'builders'
) {
	const _redirectsURL = new URL('./_redirects', dir);
	const kind = type ?? 'functions';

	const definitions: RedirectDefinition[] = [];

	for (const route of routes) {
		if (route.pathname) {
			if (route.distURL) {
				definitions.push({
					dynamic: false,
					input: route.pathname,
					target: prependForwardSlash(route.distURL.toString().replace(dir.toString(), '')),
					status: 200,
					weight: 1,
				});
			} else {
				definitions.push({
					dynamic: false,
					input: route.pathname,
					target: `/.netlify/${kind}/${entryFile}`,
					status: 200,
					weight: 1,
				});

				if (route.route === '/404') {
					definitions.push({
						dynamic: true,
						input: '/*',
						target: `/.netlify/${kind}/${entryFile}`,
						status: 404,
						weight: 0,
					});
				}
			}
		} else {
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

			if (route.distURL) {
				const target =
					`${pattern}` + (config.build.format === 'directory' ? '/index.html' : '.html');
				definitions.push({
					dynamic: true,
					input: pattern,
					target,
					status: 200,
					weight: 1,
				});
			} else {
				definitions.push({
					dynamic: true,
					input: pattern,
					target: `/.netlify/${kind}/${entryFile}`,
					status: 200,
					weight: 1,
				});
			}
		}
	}

	let _redirects = prettify(definitions);

	// Always use appendFile() because the redirects file could already exist,
	// e.g. due to a `/public/_redirects` file that got copied to the output dir.
	// If the file does not exist yet, appendFile() automatically creates it.
	await fs.promises.appendFile(_redirectsURL, _redirects, 'utf-8');
}

function prettify(definitions: RedirectDefinition[]) {
	let minInputLength = 0,
		minTargetLength = 0;
	definitions.sort((a, b) => {
		// Find the longest input, so we can format things nicely
		if (a.input.length > minInputLength) {
			minInputLength = a.input.length;
		}
		if (b.input.length > minInputLength) {
			minInputLength = b.input.length;
		}

		// Same for the target
		if (a.target.length > minTargetLength) {
			minTargetLength = a.target.length;
		}
		if (b.target.length > minTargetLength) {
			minTargetLength = b.target.length;
		}

		// Sort dynamic routes on top
		return b.weight - a.weight;
	});

	let _redirects = '';
	// Loop over the definitions
	definitions.forEach((defn, i) => {
		// Figure out the number of spaces to add. We want at least 4 spaces
		// after the input. This ensure that all targets line up together.
		let inputSpaces = minInputLength - defn.input.length + 4;
		let targetSpaces = minTargetLength - defn.target.length + 4;
		_redirects +=
			(i === 0 ? '' : '\n') +
			defn.input +
			' '.repeat(inputSpaces) +
			defn.target +
			' '.repeat(Math.abs(targetSpaces)) +
			defn.status;
	});
	return _redirects;
}

function prependForwardSlash(str: string) {
	return str[0] === '/' ? str : '/' + str;
}
