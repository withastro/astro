import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import { getVercelOutput, writeJson } from '../lib/fs.js';
import { copyDependenciesToFunction } from '../lib/nft.js';
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
			'astro:build:start': async ({ buildConfig }) => {
				buildConfig.serverEntry = serverEntry = 'entry.js';
				buildConfig.client = new URL('./static/', _config.outDir);
				buildConfig.server = functionFolder = new URL('./functions/render.func/', _config.outDir);
			},
			'astro:build:done': async ({ routes }) => {
				// Copy necessary files (e.g. node_modules/)
				await copyDependenciesToFunction(_config.root, functionFolder, serverEntry);

				// Enable ESM
				// https://aws.amazon.com/blogs/compute/using-node-js-es-modules-and-top-level-await-in-aws-lambda/
				await writeJson(new URL(`./package.json`, functionFolder), {
					type: 'module',
				});

				// Serverless function config
				// https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions/configuration
				await writeJson(new URL(`./.vc-config.json`, functionFolder), {
					runtime: getRuntime(),
					handler: serverEntry,
					launcherType: 'Nodejs',
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

function getRuntime() {
	const version = process.version.slice(1); // 'v16.5.0' --> '16.5.0'
	const major = version.split('.')[0]; // '16.5.0' --> '16'
	return `nodejs${major}.x`;
}
