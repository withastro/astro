import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import { describe, it } from 'node:test';
import astro from '@astrojs/vite-plugin-astro';
import router, { getRouterApi } from '@astrojs/vite-plugin-router';
import { ServerIslandsState } from '@astrojs/vite-plugin-router/_internal/core/server-islands/shared-state.js';
import { resolveConfig } from 'vite';
import { toAstroCli, toAstroOptions } from '../../../dist/core/astro-options.js';
import { toRouterConfig } from '../../../dist/core/router-config.js';
import { toRouterCli, toRouterOptions } from '../../../dist/core/router-options.js';
import { createBasicSettings, defaultLogger } from '../test-utils.ts';

describe('router(toRouterOptions(), toRouterCli())', () => {
	it('resolves the same config as toRouterConfig()', async () => {
		const settings = await createBasicSettings({
			base: '/docs',
			outDir: './custom-dist',
			cacheDir: './custom-cache',
			trailingSlash: 'always',
			build: { format: 'file', assetsPrefix: 'https://cdn.example.com' },
			redirects: { '/old': '/new' },
			server: { headers: { 'x-test': '1' } },
		});
		settings.pageExtensions.push('.md');
		const routesList = { routes: [] };
		const serverIslandsState = new ServerIslandsState();
		const command = 'build';
		const viteConfig = await resolveConfig(
			{
				configFile: false,
				logLevel: 'silent',
				root: settings.config.root.pathname,
				plugins: [
					...router(
						toRouterOptions(settings),
						toRouterCli(settings, {
							logger: defaultLogger,
							command,
							sync: false,
							fs: nodeFs,
							routesList,
							serverIslandsState,
							cssContentCache: new Map(),
						}),
					),
					...astro(
						toAstroOptions(settings),
						toAstroCli(settings, {
							logger: defaultLogger,
							command,
							routesList,
							serverIslandsState,
						}),
					),
				],
			},
			command,
		);

		assert.deepEqual(getRouterApi(viteConfig).config, toRouterConfig(settings));
	});
});
