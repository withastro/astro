import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';
import type { Args } from './netlify-functions.js';
import { createRedirects } from './shared.js';

export function getAdapter(args: Args = {}): AstroAdapter {
	return {
		name: '@astrojs/netlify/functions',
		serverEntrypoint: '@astrojs/netlify/netlify-functions.js',
		exports: ['handler'],
		args,
	};
}

interface NetlifyFunctionsOptions {
	dist?: URL;
	binaryMediaTypes?: string[];
}

function netlifyFunctions({
	dist,
	binaryMediaTypes,
}: NetlifyFunctionsOptions = {}): AstroIntegration {
	let _config: AstroConfig;
	let entryFile: string;
	let needsBuildConfig = false;
	return {
		name: '@astrojs/netlify',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				needsBuildConfig = !config.build.client;
				const outDir = dist ?? new URL('./dist/', config.root);
				updateConfig({
					outDir,
					build: {
						client: outDir,
						server: new URL('./.netlify/functions-internal/', config.root),
					},
				});
			},
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter({ binaryMediaTypes }));
				_config = config;
				entryFile = config.build.serverEntry.replace(/\.m?js/, '');

				if (config.output === 'static') {
					console.warn(`[@astrojs/netlify] \`output: "server"\` is required to use this adapter.`);
					console.warn(
						`[@astrojs/netlify] Otherwise, this adapter is not required to deploy a static site to Netlify.`
					);
				}
			},
			'astro:build:start': ({ buildConfig }) => {
				if (needsBuildConfig) {
					buildConfig.client = _config.outDir;
					buildConfig.server = new URL('./.netlify/functions-internal/', _config.root);
					entryFile = buildConfig.serverEntry.replace(/\.m?js/, '');
				}
			},
			'astro:build:done': async ({ routes, dir }) => {
				await createRedirects(routes, dir, entryFile, false);
			},
		},
	};
}

export { netlifyFunctions, netlifyFunctions as default };
