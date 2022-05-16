import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import { createRedirects } from './shared.js';

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
					config.outDir = new URL('./dist/', config.root);
				}
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async ({ buildConfig }) => {
				entryFile = buildConfig.serverEntry.replace(/\.m?js/, '');
				buildConfig.client = _config.outDir;
				buildConfig.server = new URL('./.netlify/functions-internal/', _config.root);
			},
			'astro:build:done': async ({ routes, dir }) => {
				await createRedirects(routes, dir, entryFile, false);
			},
		},
	};
}

export { netlifyFunctions, netlifyFunctions as default };
