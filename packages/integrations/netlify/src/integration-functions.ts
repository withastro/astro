import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import fs from 'fs';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/netlify/functions',
		serverEntrypoint: '@astrojs/netlify/netlify-functions.js',
		exports: ['handler'],
		args: {},
	};
}

interface NetlifyFunctionsOptions {
	dist?: URL;
}

function netlifyFunctions({ dist }: NetlifyFunctionsOptions = {}): AstroIntegration {
	let _config: AstroConfig;
	let entryFile: string;
	return {
		name: '@astrojs/netlify',
		hooks: {
			'astro:config:setup': ({ config }) => {
				if (dist) {
					config.outDir = dist;
				} else {
					config.outDir = new URL('./netlify/', config.root);
				}
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async ({ buildConfig }) => {
				entryFile = buildConfig.serverEntry.replace(/\.m?js/, '');
				buildConfig.client = _config.outDir;
				buildConfig.server = new URL('./functions/', _config.outDir);
			},
			'astro:build:done': async ({ routes, dir }) => {
				const _redirectsURL = new URL('./_redirects', dir);

				// Create the redirects file that is used for routing.
				let _redirects = '';
				for (const route of routes) {
					if (route.pathname) {
						_redirects += `
${route.pathname}    /.netlify/functions/${entryFile}    200`;
					} else {
						const pattern =
							'/' + route.segments.map(([part]) => (part.dynamic ? '*' : part.content)).join('/');
						_redirects += `
${pattern}    /.netlify/functions/${entryFile}    200`;
					}
				}

				// Always use appendFile() because the redirects file could already exist,
				// e.g. due to a `/public/_redirects` file that got copied to the output dir.
				// If the file does not exist yet, appendFile() automatically creates it.
				await fs.promises.appendFile(_redirectsURL, _redirects, 'utf-8');
			},
		},
	};
}

export { netlifyFunctions, netlifyFunctions as default };
