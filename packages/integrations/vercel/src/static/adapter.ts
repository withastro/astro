import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import {
	defaultImageConfig,
	getImageConfig,
	throwIfAssetsNotEnabled,
	type VercelImageConfig,
} from '../image/shared.js';
import { exposeEnv } from '../lib/env.js';
import { emptyDir, getVercelOutput, writeJson } from '../lib/fs.js';
import { isServerLikeOutput } from '../lib/prerender.js';
import { getRedirects } from '../lib/redirects.js';

const PACKAGE_NAME = '@astrojs/vercel/static';

function getAdapter(): AstroAdapter {
	return { name: PACKAGE_NAME };
}

export interface VercelStaticConfig {
	analytics?: boolean;
	imageService?: boolean;
	imagesConfig?: VercelImageConfig;
}

export default function vercelStatic({
	analytics,
	imageService,
	imagesConfig,
}: VercelStaticConfig = {}): AstroIntegration {
	let _config: AstroConfig;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ command, config, injectScript, updateConfig }) => {
				if (command === 'build' && analytics) {
					injectScript('page', 'import "@astrojs/vercel/analytics"');
				}
				const outDir = new URL('./static/', getVercelOutput(config.root));
				const viteDefine = exposeEnv(['VERCEL_ANALYTICS_ID']);
				updateConfig({
					outDir,
					build: {
						format: 'directory',
					},
					vite: {
						define: viteDefine,
					},
					...getImageConfig(imageService, imagesConfig, command),
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				throwIfAssetsNotEnabled(config, imageService);
				setAdapter(getAdapter());
				_config = config;

				if (isServerLikeOutput(config)) {
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
					...(imageService || imagesConfig
						? { images: imagesConfig ? imagesConfig : defaultImageConfig }
						: {}),
				});
			},
		},
	};
}
