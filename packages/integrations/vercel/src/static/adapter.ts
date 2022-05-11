import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import { getVercelOutput, writeJson, emptyDir } from '../lib/fs.js';
import { getRedirects } from '../lib/redirects.js';

const PACKAGE_NAME = '@astrojs/vercel/static';

function getAdapter(): AstroAdapter {
	return { name: PACKAGE_NAME };
}

export default function vercelStatic(): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config }) => {
				config.outDir = new URL('./static/', getVercelOutput(config.root));
				config.build.format = 'directory';
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;
			},
			'astro:build:start': async ({ buildConfig }) => {
				if (String(process.env.ENABLE_VC_BUILD) !== '1') {
					throw new Error(
						`The enviroment variable "ENABLE_VC_BUILD" was not found. Make sure you have it set to "1" in your Vercel project.\nLearn how to set enviroment variables here: https://vercel.com/docs/concepts/projects/environment-variables`
					);
				}

				buildConfig.staticMode = true;

				// Ensure to have `.vercel/output` empty.
				// This is because, when building to static, outDir = .vercel/output/static/,
				// so .vercel/output itself won't get cleaned.
				await emptyDir(getVercelOutput(_config.root));
			},
			'astro:build:done': async ({ routes }) => {
				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL(`./config.json`, getVercelOutput(_config.root)), {
					version: 3,
					routes: [...getRedirects(routes, _config), { handle: 'filesystem' }],
				});
			},
		},
	};
}
