import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';
import { relative as relativePath } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	copyFilesToFunction,
	getFilesFromFolder,
	getVercelOutput,
	removeDir,
	writeJson,
} from '../lib/fs.js';
import { getRedirects } from '../lib/redirects.js';

const PACKAGE_NAME = '@astrojs/vercel/edge';

function getAdapter(): AstroAdapter {
	return {
		name: PACKAGE_NAME,
		serverEntrypoint: `${PACKAGE_NAME}/entrypoint`,
		exports: ['default'],
	};
}

export interface VercelEdgeConfig {
	includeFiles?: string[];
}

export default function vercelEdge({ includeFiles = [] }: VercelEdgeConfig = {}): AstroIntegration {
	let _config: AstroConfig;
	let buildTempFolder: URL;
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
						server: new URL('./dist/', config.root),
					},
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;
				buildTempFolder = config.build.server;
				functionFolder = new URL('./functions/render.func/', config.outDir);
				serverEntry = config.build.serverEntry;

				if (config.output === 'static') {
					throw new Error(`
		[@astrojs/vercel] \`output: "server"\` is required to use the edge adapter.
	
	`);
				}
			},
			'astro:build:start': ({ buildConfig }) => {
				if (needsBuildConfig) {
					buildConfig.client = new URL('./static/', _config.outDir);
					buildTempFolder = buildConfig.server = new URL('./dist/', _config.root);
					serverEntry = buildConfig.serverEntry = 'entry.mjs';
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

					vite.build ||= {};
					vite.build.minify = true;
				}
			},
			'astro:build:done': async ({ routes }) => {
				const entry = new URL(serverEntry, buildTempFolder);
				const generatedFiles = await getFilesFromFolder(buildTempFolder);

				// Copy entry and other server files
				const commonAncestor = await copyFilesToFunction(
					[...generatedFiles, ...includeFiles.map((file) => new URL(file, _config.root))],
					functionFolder
				);

				// Remove temporary folder
				await removeDir(buildTempFolder);

				// Edge function config
				// https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions/configuration
				await writeJson(new URL(`./.vc-config.json`, functionFolder), {
					runtime: 'edge',
					entrypoint: relativePath(commonAncestor, fileURLToPath(entry)),
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
