import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import fs from 'fs';

export function getAdapter(site: string | undefined): AstroAdapter {
	return {
		name: '@astrojs/netlify',
		serverEntrypoint: '@astrojs/netlify/netlify-functions.js',
		exports: ['handler'],
		args: { site },
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
				setAdapter(getAdapter(new URL(config.base, config.site).toString()));
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
					}
				}

				if (fs.existsSync(_redirects)) {
					await fs.promises.appendFile(_redirectsURL, _redirects, 'utf-8');
				} else {
					await fs.promises.writeFile(_redirectsURL, _redirects, 'utf-8');
				}
			},
		},
	};
}

export { netlifyFunctions, netlifyFunctions as default };
