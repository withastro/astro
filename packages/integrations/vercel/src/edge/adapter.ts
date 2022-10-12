import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import { getVercelOutput, writeJson } from '../lib/fs.js';
import { getRedirects } from '../lib/redirects.js';

const PACKAGE_NAME = '@astrojs/vercel/edge';

function getAdapter(): AstroAdapter {
	return {
		name: PACKAGE_NAME,
		serverEntrypoint: `${PACKAGE_NAME}/entrypoint`,
		exports: ['default'],
	};
}

export default function vercelEdge(): AstroIntegration {
	let _config: AstroConfig;
	let functionFolder: URL;
	let serverEntry: string;
	let needsBuildConfig = false;

	return {
		name: PACKAGE_NAME,
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				needsBuildConfig = !config.build.client;
				const outDir = getVercelOutput(config.root);
				updateConfig({
					outDir,
					build: {
						serverEntry: 'entry.mjs',
						client: new URL('./static/', outDir),
						server: new URL('./functions/render.func/', config.outDir),
					},
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;
				serverEntry = config.build.serverEntry;
				functionFolder = config.build.server;
			},
			'astro:build:start': ({ buildConfig }) => {
				if (needsBuildConfig) {
					buildConfig.client = new URL('./static/', _config.outDir);
					serverEntry = buildConfig.serverEntry = 'entry.mjs';
					functionFolder = buildConfig.server = new URL('./functions/render.func/', _config.outDir);
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.resolve ||= {};
					vite.resolve.alias ||= {};

					const aliases = [{ find: 'react-dom/server', replacement: 'react-dom/server.browser' }];

					if (Array.isArray(vite.resolve.alias)) {
						vite.resolve.alias = [...vite.resolve.alias, ...aliases];
					} else {
						for (const alias of aliases) {
							(vite.resolve.alias as Record<string, string>)[alias.find] = alias.replacement;
						}
					}

					vite.ssr = {
						target: 'webworker',
						noExternal: true,
					};
				}
			},
			'astro:build:done': async ({ routes }) => {
				// Edge function config
				// https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions/configuration
				await writeJson(new URL(`./.vc-config.json`, functionFolder), {
					runtime: 'edge',
					entrypoint: serverEntry,
				});

				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL(`./config.json`, _config.outDir), {
					version: 3,
					routes: [
						...getRedirects(routes, _config),
						{ handle: 'filesystem' },
						{ src: '/.*', dest: 'render' },
					],
				});
			},
		},
	};
}
