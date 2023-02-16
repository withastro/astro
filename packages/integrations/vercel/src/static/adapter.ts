import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import { emptyDir, getVercelOutput, writeJson } from '../lib/fs.js';
import { getRedirects } from '../lib/redirects.js';

const PACKAGE_NAME = '@astrojs/vercel/static';

function getAdapter(): AstroAdapter {
	return { name: PACKAGE_NAME };
}

export interface VercelStaticConfig {
	analytics?: boolean;
}

export default function vercelStatic({ analytics }: VercelStaticConfig = {}): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ command, config, injectScript }) => {
				if (command === 'build' && analytics) {
					injectScript('page', 'import "@astrojs/vercel/analytics"');
				}
				config.outDir = new URL('./static/', getVercelOutput(config.root));
				config.build.format = 'directory';
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;

				if (config.output === 'server') {
					throw new Error(`${PACKAGE_NAME} should be used with output: 'static'`);
				}
			},
			'astro:build:start': async () => {
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
