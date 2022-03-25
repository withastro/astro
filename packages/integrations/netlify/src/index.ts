import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import fs from 'fs';

export function getAdapter(site: string | undefined): AstroAdapter {
	return {
		name: '@astrojs/netlify',
		serverEntrypoint: '@astrojs/netlify/netlify-functions.js',
		exports: ['handler'],
		args: { site }
	};
}

function netlifyFunctions(): AstroIntegration {
	let _config: AstroConfig;
	let entryFile: string;
	return {
		name: '@astrojs/netlify',
		hooks: {
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter(config.buildOptions.site));
				_config = config;
			},
			'astro:build:start': async({ buildConfig }) => {
				entryFile = buildConfig.serverEntry.replace(/\.m?js/, '');
				buildConfig.client = _config.dist;
				buildConfig.server = new URL('./functions/', _config.dist);
			},
			'astro:build:done': async ({ routes, dir }) => {
				// Create the redirects file that is used for routing.
				let _redirects = '';
				for(const route of routes) {
					if(route.pathname) {
						_redirects += `
${route.pathname}    /.netlify/functions/${entryFile}    200`
					}
				}
				const _redirectsURL = new URL('./_redirects', dir);
				await fs.promises.writeFile(_redirectsURL, _redirects, 'utf-8');
			}
		},
	};
}

export {
	netlifyFunctions,
	netlifyFunctions as default
};
