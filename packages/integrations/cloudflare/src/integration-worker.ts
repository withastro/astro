import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/cloudflare/worker',
		serverEntrypoint: '@astrojs/cloudflare/cloudflare-worker',
		exports: ['default'],
	};
}

export function cloudflare(): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/cloudflare/worker',
		hooks: {
			'astro:config:done': ({ config, setAdapter }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async ({ buildConfig }) => {
				buildConfig.client = _config.outDir;

				buildConfig.server = _config.outDir;
				buildConfig.serverEntry = '_worker.js';
			},
			'astro:build:setup': ({ target, vite }) => {
				if (target === 'server') {
					vite.ssr = {
						noExternal: true,
					};
				}
			},
		},
	};
}
