import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import { writeJson, copyFunctionNFT, getVercelOutput } from '../lib/fs.js';
import { getRedirects } from '../lib/redirects.js';

const PACKAGE_NAME = '@astrojs/vercel/serverless';

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

	return {
		name: PACKAGE_NAME,
		hooks: {
			'astro:config:setup': ({ config }) => {
				config.outDir = getVercelOutput(config.root);
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			// 'astro:build:setup': ({ vite, target }) => {
			// 	if (target === 'server') {
			// 		vite.build = {
			// 			...(vite.build || {}),
			// 			rollupOptions: {
			// 				...(vite.build?.rollupOptions || {}),
			// 				output: {
			// 					...(vite.build?.rollupOptions?.output || {}),
			// 					format: 'cjs',
			// 				},
			// 			},
			// 		};
			// 	}
			// },
			'astro:build:start': async ({ buildConfig }) => {
				if (String(process.env.ENABLE_VC_BUILD) !== '1') {
					throw new Error(
						`The enviroment variable "ENABLE_VC_BUILD" was not found. Make sure you have it set to "1" in your Vercel project.\nLearn how to set enviroment variables here: https://vercel.com/docs/concepts/projects/environment-variables`
					);
				}

				buildConfig.serverEntry = serverEntry = 'entry.js';
				buildConfig.client = new URL('./static/', _config.outDir);
				buildConfig.server = functionFolder = new URL('./functions/render.func/', _config.outDir);
			},
			'astro:build:done': async ({ routes }) => {
				// Bundle dependencies
				// await esbuild.build({
				// 	entryPoints: [entryPath],
				// 	outfile: entryPath,
				// 	bundle: true,
				// 	target: 'node14.19',
				// 	format: 'esm',
				// 	platform: 'node',
				// 	allowOverwrite: true,
				// });

				// Copy necessary files (e.g. node_modules/)
				await copyFunctionNFT(_config.root, functionFolder, serverEntry);

				// Edge function config
				// https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions/configuration
				await writeJson(new URL(`./.vc-config.json`, functionFolder), {
					runtime: 'nodejs14.x',
					handler: serverEntry,
					launcherType: 'Nodejs',
				});

				await writeJson(new URL(`./package.json`, functionFolder), {
					type: 'module',
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
